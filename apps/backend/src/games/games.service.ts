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
      sortBy = 'averageRating',
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

    return PaginatedGamesResponseDto.from(games.map(mapIgdbToDto), page, limit, count);
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

  async updateRating(gameId: string): Promise<void> {
    try {
      const exists = await this.prisma.game.findUnique({ where: { id: gameId } });
      if (!exists) return;
      const result = await this.prisma.review.aggregate({
        where: { gameId, isPublished: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.game.update({
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
