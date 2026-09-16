import type {
  GameResponse,
  GameDetail,
  GameFilterOptions,
  PaginatedGamesResponse,
  GamesQuery,
} from '@glitch/shared-types';
import { apiClient } from './api';

const GAMES_ENDPOINTS = {
  GAMES: 'games',
  FILTERS: 'games/filters',
  GAME_BY_SLUG: (slug: string) => `games/${slug}`,
  SIMILAR_GAMES: (id: string) => `games/${id}/similar`,
} as const;

class GamesService {
  async getAllGames(query: GamesQuery = {}): Promise<PaginatedGamesResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            value.forEach((item) => searchParams.append(key, item.toString()));
          }
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const endpoint = searchParams.toString()
      ? `${GAMES_ENDPOINTS.GAMES}?${searchParams.toString()}`
      : GAMES_ENDPOINTS.GAMES;

    return apiClient.get<PaginatedGamesResponse>(endpoint, { skipAuth: true });
  }

  async getFilterOptions(): Promise<GameFilterOptions> {
    return apiClient.get<GameFilterOptions>(GAMES_ENDPOINTS.FILTERS, {
      skipAuth: true,
    });
  }

  async getGameBySlug(slug: string): Promise<GameDetail> {
    if (!slug) {
      throw new Error('Game slug is required');
    }

    return apiClient.get<GameDetail>(GAMES_ENDPOINTS.GAME_BY_SLUG(slug), {
      skipAuth: true,
    });
  }

  async getSimilarGames(gameId: string, limit?: number): Promise<GameResponse[]> {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const searchParams = new URLSearchParams();
    if (limit !== undefined) {
      searchParams.append('limit', limit.toString());
    }

    const endpoint = searchParams.toString()
      ? `${GAMES_ENDPOINTS.SIMILAR_GAMES(gameId)}?${searchParams.toString()}`
      : GAMES_ENDPOINTS.SIMILAR_GAMES(gameId);

    return apiClient.get<GameResponse[]>(endpoint, { skipAuth: true });
  }

  async searchGames(
    searchTerm: string,
    options: Omit<GamesQuery, 'search'> = {},
  ): Promise<PaginatedGamesResponse> {
    if (!searchTerm.trim()) {
      throw new Error('Search term is required');
    }

    return this.getAllGames({ ...options, search: searchTerm.trim() });
  }

  async getGamesByGenre(
    genreIds: number[],
    options: Omit<GamesQuery, 'genreIds'> = {},
  ): Promise<PaginatedGamesResponse> {
    return this.getAllGames({ ...options, genreIds });
  }

  async getGamesByPlatform(
    platformIds: number[],
    options: Omit<GamesQuery, 'platformIds'> = {},
  ): Promise<PaginatedGamesResponse> {
    return this.getAllGames({ ...options, platformIds });
  }

  async getTopRatedGames(options: GamesQuery = {}): Promise<PaginatedGamesResponse> {
    return this.getAllGames({
      ...options,
      sortBy: 'averageRating',
      sortOrder: 'desc',
      minRating: options.minRating ?? 7,
    });
  }

  async getRecentGames(options: GamesQuery = {}): Promise<PaginatedGamesResponse> {
    return this.getAllGames({
      ...options,
      sortBy: 'releaseDate',
      sortOrder: 'desc',
    });
  }

  async getPopularGames(options: GamesQuery = {}): Promise<PaginatedGamesResponse> {
    return this.getAllGames({
      ...options,
      sortBy: 'reviewCount',
      sortOrder: 'desc',
    });
  }
}

export const gamesService = new GamesService();

export function createGamesService(): GamesService {
  return new GamesService();
}

export const {
  getAllGames,
  getFilterOptions,
  getGameBySlug,
  getSimilarGames,
  searchGames,
  getGamesByGenre,
  getGamesByPlatform,
  getTopRatedGames,
  getRecentGames,
  getPopularGames,
} = gamesService;
