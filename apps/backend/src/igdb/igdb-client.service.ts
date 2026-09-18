import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IgdbAuthService } from './igdb-auth.service';
import { IgdbGame, IgdbGenre, IgdbPlatform } from './igdb.types';

const IGDB_FIELDS = [
  'id',
  'name',
  'slug',
  'summary',
  'storyline',
  'first_release_date',
  'cover.image_id',
  'screenshots.image_id',
  'videos.video_id',
  'videos.name',
  'genres.id',
  'genres.name',
  'genres.slug',
  'platforms.id',
  'platforms.name',
  'platforms.slug',
  'platforms.abbreviation',
  'involved_companies.company.id',
  'involved_companies.company.name',
  'involved_companies.company.slug',
  'involved_companies.developer',
  'involved_companies.publisher',
  'total_rating',
  'rating',
  'rating_count',
  'aggregated_rating',
  'status',
  'category',
].join(',');

const SORT_MAP: Record<string, string> = {
  title: 'name',
  releaseDate: 'first_release_date',
  igdbRating: 'total_rating',
  igdbRatingCount: 'rating_count',
  createdAt: 'first_release_date',
};

@Injectable()
export class IgdbClientService {
  private readonly logger = new Logger(IgdbClientService.name);
  private lastRequestAt = 0;

  // ponytail: naive 250ms throttle for IGDB 4 req/s limit, per-instance lock if concurrency matters
  private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < 250) {
      await new Promise((r) => setTimeout(r, 250 - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: IgdbAuthService,
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>('IGDB_BASE_URL') || 'https://api.igdb.com/v4';
  }

  private get clientId(): string {
    const id = this.configService.get<string>('TWITCH_CLIENT_ID');
    if (!id) throw new InternalServerErrorException('TWITCH_CLIENT_ID not configured');
    return id;
  }

  private async requestRaw<T>(
    endpoint: string,
    apicalypseQuery: string,
  ): Promise<{ data: T; count: number | null }> {
    await this.throttle();

    const url = `${this.baseUrl}/${endpoint}`;
    const send = (token: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: apicalypseQuery,
      });

    let res = await send(await this.authService.getAccessToken());

    if (res.status === 401) {
      this.logger.warn('IGDB 401, clearing token cache and retrying once');
      this.authService.clearCache();
      res = await send(await this.authService.getAccessToken());
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`IGDB ${endpoint} failed: ${res.status} ${text} | query: ${apicalypseQuery}`);
      throw new InternalServerErrorException(`IGDB request failed: ${res.status}`);
    }

    const headerCount = res.headers.get('x-count');
    return {
      data: (await res.json()) as T,
      count: headerCount === null ? null : Number(headerCount),
    };
  }

  private async request<T>(endpoint: string, apicalypseQuery: string): Promise<T> {
    return (await this.requestRaw<T>(endpoint, apicalypseQuery)).data;
  }

  private buildWhere(igdbSort: string, extraWhere?: string): string {
    const clauses = ['cover != null'];
    if (igdbSort === 'total_rating') clauses.push('total_rating != null');
    if (extraWhere) clauses.push(extraWhere);
    return clauses.join(' & ');
  }

  async searchGames(options: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    where?: string;
  }): Promise<{ games: IgdbGame[]; count: number }> {
    const limit = Math.min(options.limit ?? 12, 100);
    const offset = options.offset ?? 0;
    const igdbSort = SORT_MAP[options.sortBy || ''] || 'total_rating';
    const order = options.sortOrder === 'asc' ? 'asc' : 'desc';

    let query = `fields ${IGDB_FIELDS}; where ${this.buildWhere(igdbSort, options.where)};`;

    const term = options.search?.trim();
    if (term) {
      query += ` search "${term.replace(/"/g, '\\"')}";`;
    } else {
      query += ` sort ${igdbSort} ${order};`;
    }
    query += ` limit ${limit}; offset ${offset};`;

    this.logger.debug(`IGDB search query: ${query}`);
    const { data, count } = await this.requestRaw<IgdbGame[]>('games', query);
    return { games: data, count: count ?? data.length };
  }

  async getGenres(): Promise<IgdbGenre[]> {
    return this.request<IgdbGenre[]>('genres', 'fields id,name,slug; sort name asc; limit 50;');
  }

  async getPlatforms(): Promise<IgdbPlatform[]> {
    return this.request<IgdbPlatform[]>(
      'platforms',
      'fields id,name,slug,abbreviation; sort name asc; limit 500;',
    );
  }

  async findBySlug(slug: string): Promise<IgdbGame | null> {
    const query = `fields ${IGDB_FIELDS}; where slug = "${slug}"; limit 1;`;
    const res = await this.request<IgdbGame[]>('games', query);
    return res[0] || null;
  }

  async findById(id: number): Promise<IgdbGame | null> {
    const query = `fields ${IGDB_FIELDS}; where id = ${id}; limit 1;`;
    const res = await this.request<IgdbGame[]>('games', query);
    return res[0] || null;
  }

  async getSimilarGames(gameId: number, limit = 6): Promise<IgdbGame[]> {
    const source = await this.findById(gameId);
    if (!source || !source.genres?.length) {
      return (await this.searchGames({ limit, sortBy: 'total_rating', sortOrder: 'desc' })).games;
    }
    const genreIds = source.genres.map((g) => g.id).join(',');
    const where = `genres = (${genreIds}) & id != ${gameId}`;
    return (await this.searchGames({ limit, sortBy: 'total_rating', sortOrder: 'desc', where }))
      .games;
  }

  async getPopularGames(limit = 12): Promise<IgdbGame[]> {
    return (await this.searchGames({ limit, sortBy: 'total_rating', sortOrder: 'desc' })).games;
  }

  async getRecentGames(limit = 12): Promise<IgdbGame[]> {
    return (await this.searchGames({ limit, sortBy: 'first_release_date', sortOrder: 'desc' })).games;
  }
}
