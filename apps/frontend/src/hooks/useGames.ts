import { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type {
  GameResponse,
  GameDetail,
  PaginatedGamesResponse,
  GamesQuery,
} from '@glitch/shared-types';

import { gamesService } from '@/services/games';
import {
  $gamesData,
  $gamesLoading,
  $gamesError,
  $gameDetail,
  $gameDetailLoading,
  $gameDetailError,
  $similarGames,
  $similarGamesLoading,
  setGamesLoading,
  setGamesError,
  setGamesData,
  setGameDetailLoading,
  setGameDetailError,
  setGameDetail,
  setSimilarGames,
  setSimilarGamesLoading,
  clearGamesState,
  clearGameDetailState,
} from '@/stores/games';

// ============================================================================
// Types
// ============================================================================

interface UseGamesReturn {
  // State
  data: PaginatedGamesResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGames: (query?: GamesQuery) => Promise<PaginatedGamesResponse>;
  searchGames: (
    searchTerm: string,
    options?: Omit<GamesQuery, 'search'>,
  ) => Promise<PaginatedGamesResponse>;
  getGamesByGenre: (
    genreIds: number[],
    options?: Omit<GamesQuery, 'genreIds'>,
  ) => Promise<PaginatedGamesResponse>;
  getGamesByPlatform: (
    platformIds: number[],
    options?: Omit<GamesQuery, 'platformIds'>,
  ) => Promise<PaginatedGamesResponse>;
  getTopRatedGames: (options?: GamesQuery) => Promise<PaginatedGamesResponse>;
  getRecentGames: (options?: GamesQuery) => Promise<PaginatedGamesResponse>;
  getPopularGames: (options?: GamesQuery) => Promise<PaginatedGamesResponse>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: () => Promise<void>;
}

interface UseGameDetailReturn {
  // State
  game: GameDetail | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGameDetail: (slug: string) => Promise<GameDetail>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: (slug?: string) => Promise<void>;
}

interface UseSimilarGamesReturn {
  // State
  games: GameResponse[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSimilarGames: (gameId: string, limit?: number) => Promise<GameResponse[]>;
  clearError: () => void;
  clearData: () => void;
}

// ============================================================================
// Games List Hook
// ============================================================================

/**
 * Hook for managing games list with filtering, searching, and pagination
 *
 * @example
 * ```tsx
 * function GamesList() {
 *   const {
 *     data,
 *     isLoading,
 *     error,
 *     fetchGames,
 *     searchGames,
 *     clearError
 *   } = useGames();
 *
 *   useEffect(() => {
 *     fetchGames({ page: 1, limit: 12, sortBy: 'averageRating', sortOrder: 'desc' });
 *   }, []);
 *
 *   const handleSearch = (searchTerm: string) => {
 *     searchGames(searchTerm, { limit: 20 });
 *   };
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       {data?.data.map(game => (
 *         <GameCard key={game.game.id} game={game} />
 *       ))}
 *       <Pagination
 *         currentPage={data?.page || 1}
 *         totalPages={data?.totalPages || 1}
 *         hasNext={data?.hasNextPage}
 *         hasPrevious={data?.hasPreviousPage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useGames(): UseGamesReturn {
  // Subscribe to global games stores
  const data = useStore($gamesData);
  const isLoading = useStore($gamesLoading);
  const error = useStore($gamesError);

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchGames = useCallback(
    async (query: GamesQuery = {}): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getAllGames(query);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const searchGames = useCallback(
    async (
      searchTerm: string,
      options: Omit<GamesQuery, 'search'> = {},
    ): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.searchGames(searchTerm, options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const getGamesByGenre = useCallback(
    async (
      genreIds: number[],
      options: Omit<GamesQuery, 'genreIds'> = {},
    ): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getGamesByGenre(genreIds, options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch games by genre';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const getGamesByPlatform = useCallback(
    async (
      platformIds: number[],
      options: Omit<GamesQuery, 'platformIds'> = {},
    ): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getGamesByPlatform(platformIds, options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch games by platform';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const getTopRatedGames = useCallback(
    async (options: GamesQuery = {}): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getTopRatedGames(options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch top-rated games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const getRecentGames = useCallback(
    async (options: GamesQuery = {}): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getRecentGames(options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch recent games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  const getPopularGames = useCallback(
    async (options: GamesQuery = {}): Promise<PaginatedGamesResponse> => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const response = await gamesService.getPopularGames(options);
        setGamesData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch popular games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setGamesLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setGamesError(null);
  }, []);

  const clearData = useCallback(() => {
    clearGamesState();
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    // If we have existing data, refetch with the same query
    // This is a basic implementation - you might want to store the last query
    if (data) {
      await fetchGames();
    }
  }, [data, fetchGames]);

  return {
    // State
    data,
    isLoading,
    error,

    // Actions
    fetchGames,
    searchGames,
    getGamesByGenre,
    getGamesByPlatform,
    getTopRatedGames,
    getRecentGames,
    getPopularGames,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

// ============================================================================
// Game Detail Hook
// ============================================================================

/**
 * Hook for managing individual game details
 *
 * @example
 * ```tsx
 * function GameDetailPage({ slug }: { slug: string }) {
 *   const {
 *     game,
 *     isLoading,
 *     error,
 *     fetchGameDetail,
 *     clearError
 *   } = useGameDetail();
 *
 *   useEffect(() => {
 *     fetchGameDetail(slug);
 *   }, [slug]);
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *   if (!game) return <NotFound />;
 *
 *   return (
 *     <div>
 *       <GameHeader game={game} />
 *       <GameDescription description={game.description} />
 *       <GameReviews reviews={game.recentReviews} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useGameDetail(): UseGameDetailReturn {
  // Subscribe to global game detail stores
  const game = useStore($gameDetail);
  const isLoading = useStore($gameDetailLoading);
  const error = useStore($gameDetailError);

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchGameDetail = useCallback(async (slug: string): Promise<GameDetail> => {
    setGameDetailLoading(true);
    setGameDetailError(null);

    try {
      const response = await gamesService.getGameBySlug(slug);
      setGameDetail(response, slug);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch game details';
      setGameDetailError(errorMessage);
      throw error;
    } finally {
      setGameDetailLoading(false);
    }
  }, []);

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setGameDetailError(null);
  }, []);

  const clearData = useCallback(() => {
    clearGameDetailState();
  }, []);

  const refetch = useCallback(
    async (slug?: string): Promise<void> => {
      // If slug is provided, use it; otherwise try to refetch current game
      if (slug) {
        await fetchGameDetail(slug);
      } else if (game) {
        await fetchGameDetail(game.game.slug);
      }
    },
    [game, fetchGameDetail],
  );

  return {
    // State
    game,
    isLoading,
    error,

    // Actions
    fetchGameDetail,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

// ============================================================================
// Similar Games Hook
// ============================================================================

/**
 * Hook for managing similar games
 *
 * @example
 * ```tsx
 * function SimilarGamesSection({ gameId }: { gameId: string }) {
 *   const {
 *     games,
 *     isLoading,
 *     error,
 *     fetchSimilarGames,
 *     clearError
 *   } = useSimilarGames();
 *
 *   useEffect(() => {
 *     fetchSimilarGames(gameId, 6);
 *   }, [gameId]);
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *   if (!games?.length) return null;
 *
 *   return (
 *     <section>
 *       <h3>Similar Games</h3>
 *       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 *         {games.map(game => (
 *           <GameCard key={game.game.id} game={game} />
 *         ))}
 *       </div>
 *     </section>
 *   );
 * }
 * ```
 */
export function useSimilarGames(): UseSimilarGamesReturn {
  // Subscribe to global similar games stores
  const games = useStore($similarGames);
  const isLoading = useStore($similarGamesLoading);
  const error = useStore($gamesError); // Reuse main games error state

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchSimilarGames = useCallback(
    async (gameId: string, limit?: number): Promise<GameResponse[]> => {
      setSimilarGamesLoading(true);
      setGamesError(null); // Clear any existing errors

      try {
        const response = await gamesService.getSimilarGames(gameId, limit);
        setSimilarGames(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch similar games';
        setGamesError(errorMessage);
        throw error;
      } finally {
        setSimilarGamesLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setGamesError(null);
  }, []);

  const clearData = useCallback(() => {
    setSimilarGames([]);
  }, []);

  return {
    // State
    games,
    isLoading,
    error,

    // Actions
    fetchSimilarGames,
    clearError,
    clearData,
  };
}

// ============================================================================
// Specialized Games Hooks
// ============================================================================

/**
 * Hook for fetching and managing featured games (top-rated)
 */
export function useFeaturedGames(limit: number = 12) {
  const { data, isLoading, error, getTopRatedGames, clearError } = useGames();

  const fetchFeaturedGames = useCallback(async () => {
    return getTopRatedGames({
      limit,
      minRating: 8.0,
      sortBy: 'averageRating',
      sortOrder: 'desc',
    });
  }, [getTopRatedGames, limit]);

  useEffect(() => {
    fetchFeaturedGames();
  }, [fetchFeaturedGames]);

  return {
    games: data?.data || [],
    isLoading,
    error,
    refetch: fetchFeaturedGames,
    clearError,
  };
}

/**
 * Hook for fetching and managing new releases
 */
export function useNewReleases(limit: number = 12) {
  const { data, isLoading, error, getRecentGames, clearError } = useGames();

  const fetchNewReleases = useCallback(async () => {
    return getRecentGames({
      limit,
      status: 'RELEASED',
      sortBy: 'releaseDate',
      sortOrder: 'desc',
    });
  }, [getRecentGames, limit]);

  useEffect(() => {
    fetchNewReleases();
  }, [fetchNewReleases]);

  return {
    games: data?.data || [],
    isLoading,
    error,
    refetch: fetchNewReleases,
    clearError,
  };
}

/**
 * Hook for fetching and managing trending games (popular)
 */
export function useTrendingGames(limit: number = 12) {
  const { data, isLoading, error, getPopularGames, clearError } = useGames();

  const fetchTrendingGames = useCallback(async () => {
    return getPopularGames({
      limit,
      sortBy: 'reviewCount',
      sortOrder: 'desc',
    });
  }, [getPopularGames, limit]);

  useEffect(() => {
    fetchTrendingGames();
  }, [fetchTrendingGames]);

  return {
    games: data?.data || [],
    isLoading,
    error,
    refetch: fetchTrendingGames,
    clearError,
  };
}
