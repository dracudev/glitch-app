import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Game } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { IgdbClientService } from '@/igdb/igdb-client.service';
import { coverUrlFor } from '@/igdb/igdb.mapper';
import {
  toGameResponseDto as mapIgdbToDto,
  toGameDetailDto as mapIgdbToDetail,
} from '@/igdb/igdb.mapper';
import {
  GameResponseDto,
  GameDetailDto,
  GameFilterOptionsDto,
  PaginatedGamesResponseDto,
  GamesQueryDto,
} from './dto';
import { GAMES_CONSTANTS, GAME_STATUSES } from './constants/games.constants';

@Injectable()
export class GamesService {
  private filterOptionsCache: { data: GameFilterOptionsDto; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly igdb: IgdbClientService,
    private readonly config: ConfigService,
  ) {}

  async findAll(query: GamesQueryDto): Promise<PaginatedGamesResponseDto> {
    const {
      page = GAMES_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = GAMES_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      search,
      sortBy = 'igdbRating',
      sortOrder = 'desc',
    } = query;

    const sanitizedSearch = search?.trim().replace(/[<>"']/g, '');
    const offset = (page - 1) * limit;

    const { games, count } = await this.igdb.searchGames({
      search: sanitizedSearch,
      limit,
      offset,
      sortBy,
      sortOrder,
      where: this.buildIgdbWhere(query),
    });

    const withLocalRatings = await this.attachLocalRatings(games.map(mapIgdbToDto));
    return PaginatedGamesResponseDto.from(withLocalRatings, page, limit, count);
  }

  async findBySlug(slug: string): Promise<GameDetailDto> {
    if (!slug) throw new BadRequestException('Slug is required');
    const igdbGame = await this.igdb.findBySlug(slug);
    if (!igdbGame) throw new NotFoundException('Game not found');

    const detail = mapIgdbToDetail(igdbGame);

    try {
      const anchor = await this.prisma.game.findUnique({ where: { igdbId: igdbGame.id } });
      if (!anchor) return detail;

      const reviews = await this.prisma.review.findMany({
        where: { gameId: anchor.id, isPublished: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      const preview = GAMES_CONSTANTS.REVIEW_PREVIEW.MAX_LENGTH;
      return {
        ...detail,
        game: {
          ...detail.game,
          averageRating: anchor.averageRating ?? undefined,
          reviewCount: anchor.reviewCount,
        },
        recentReviews: reviews.map((r) => ({
          id: r.id,
          title: r.title ?? undefined,
          content: r.content.length > preview ? `${r.content.slice(0, preview)}...` : r.content,
          rating: r.rating,
          createdAt: r.createdAt,
          user: r.user,
          stats: { likesCount: r._count.likes, commentsCount: r._count.comments },
        })),
      };
    } catch {
      return detail;
    }
  }

  // The catalogue is served live from IGDB, which knows nothing about our
  // reviews. Look up the DB anchors for the whole page in one query and overlay
  // the real Glitch score, leaving IGDB's own score in its labeled field.
  private async attachLocalRatings(games: GameResponseDto[]): Promise<GameResponseDto[]> {
    const igdbIds = games.map((g) => Number(g.game.id)).filter((id) => Number.isInteger(id));
    if (igdbIds.length === 0) return games;

    const anchors = await this.prisma.game.findMany({
      where: { igdbId: { in: igdbIds } },
      select: { igdbId: true, averageRating: true, reviewCount: true },
    });
    const byIgdbId = new Map(anchors.map((a) => [a.igdbId, a]));

    return games.map((g) => {
      const anchor = byIgdbId.get(Number(g.game.id));
      if (!anchor) return g;
      return {
        ...g,
        game: {
          ...g.game,
          averageRating: anchor.averageRating ?? undefined,
          reviewCount: anchor.reviewCount,
        },
      };
    });
  }

  async getSimilarGames(
    gameId: string,
    limit: number = GAMES_CONSTANTS.SIMILAR_GAMES.DEFAULT_LIMIT,
  ): Promise<GameResponseDto[]> {
    const numeric = Number(gameId);
    if (!Number.isNaN(numeric)) {
      return (await this.igdb.getSimilarGames(numeric, limit)).map(mapIgdbToDto);
    }
    const bySlug = await this.igdb.findBySlug(gameId);
    if (!bySlug) return [];
    return (await this.igdb.getSimilarGames(bySlug.id, limit)).map(mapIgdbToDto);
  }

  async getFilterOptions(): Promise<GameFilterOptionsDto> {
    const cached = this.filterOptionsCache;
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const [genres, platforms] = await Promise.all([
      this.igdb.getGenres(),
      this.igdb.getPlatforms(),
    ]);

    const data: GameFilterOptionsDto = {
      genres: genres.map((g) => ({ id: g.id, name: g.name, slug: g.slug })),
      platforms: platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        abbreviation: p.abbreviation,
      })),
    };

    const ttlSeconds = Number(this.config.get('IGDB_CACHE_TTL')) || 3600;
    this.filterOptionsCache = { data, expiresAt: Date.now() + ttlSeconds * 1000 };
    return data;
  }

    async resolveAnchor(identifier: string): Promise<Game> {
    const numeric = Number(identifier);
    const isIgdbId = Number.isInteger(numeric) && String(numeric) === identifier;
    const igdbGame = isIgdbId
      ? await this.igdb.findById(numeric)
      : await this.igdb.findBySlug(identifier);

    if (!igdbGame) throw new NotFoundException('Game not found');

    const metadata = {
      title: igdbGame.name,
      slug: igdbGame.slug,
      coverImage: coverUrlFor(igdbGame),
    };

    try {
      return await this.prisma.game.upsert({
        where: { igdbId: igdbGame.id },
        update: metadata,
        create: { igdbId: igdbGame.id, ...metadata },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const bySlug = await this.prisma.game.findUnique({ where: { slug: metadata.slug } });
        if (bySlug) return bySlug;
      }
      throw error;
    }
  }

  // Callers inside a $transaction must pass `tx`: this.prisma is a separate
  // connection and would not see the uncommitted write, leaving the aggregate
  // one mutation behind.
  async updateRating(
    gameId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    try {
      const exists = await client.game.findUnique({ where: { id: gameId } });
      if (!exists) return;
      const result = await client.review.aggregate({
        where: { gameId, isPublished: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await client.game.update({
        where: { id: gameId },
        data: { averageRating: result._avg.rating || 0, reviewCount: result._count.rating },
      });
    } catch {
    }
  }

    // IGDB leaves status unset for most games; "Released" must also match null.
  private buildIgdbWhere(query: GamesQueryDto): string | undefined {
    const clauses: string[] = [];

    if (query.genreIds?.length) clauses.push(`genres = (${query.genreIds.join(',')})`);
    if (query.platformIds?.length) clauses.push(`platforms = (${query.platformIds.join(',')})`);

    if (query.status !== undefined) {
      const igdbStatus = GAME_STATUSES[query.status];
      clauses.push(
        query.status === 'RELEASED'
          ? `(status = ${igdbStatus} | status = null)`
          : `status = ${igdbStatus}`,
      );
    }

    if (query.minRating !== undefined) clauses.push(`total_rating >= ${query.minRating * 10}`);
    if (query.maxRating !== undefined) clauses.push(`total_rating <= ${query.maxRating * 10}`);

    return clauses.length > 0 ? clauses.join(' & ') : undefined;
  }
}
