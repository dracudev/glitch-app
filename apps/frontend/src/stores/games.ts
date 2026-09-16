import { atom } from 'nanostores';
import type { GameResponse, GameDetail, PaginatedGamesResponse } from '@glitch/shared-types';

// ============================================================================
// Games List State
// ============================================================================

/**
 * Current games list data with pagination
 */
export const $gamesData = atom<PaginatedGamesResponse | null>(null);

/**
 * Games list loading state
 */
export const $gamesLoading = atom<boolean>(false);

/**
 * Games list error state
 */
export const $gamesError = atom<string | null>(null);

// ============================================================================
// Game Detail State
// ============================================================================

/**
 * Current game detail data
 */
export const $gameDetail = atom<GameDetail | null>(null);

/**
 * Currently loaded game slug (for refetch purposes)
 */
export const $currentGameSlug = atom<string | null>(null);

/**
 * Game detail loading state
 */
export const $gameDetailLoading = atom<boolean>(false);

/**
 * Game detail error state
 */
export const $gameDetailError = atom<string | null>(null);

// ============================================================================
// Similar Games State
// ============================================================================

/**
 * Similar games data
 */
export const $similarGames = atom<GameResponse[] | null>(null);

/**
 * Similar games loading state
 */
export const $similarGamesLoading = atom<boolean>(false);

// ============================================================================
// Games List Actions
// ============================================================================

/**
 * Set games list data
 */
export function setGamesData(data: PaginatedGamesResponse) {
  $gamesData.set(data);
}

/**
 * Set games loading state
 */
export function setGamesLoading(loading: boolean) {
  $gamesLoading.set(loading);
}

/**
 * Set games error state
 */
export function setGamesError(error: string | null) {
  $gamesError.set(error);
}

/**
 * Clear games list state
 */
export function clearGamesState() {
  $gamesData.set(null);
  $gamesLoading.set(false);
  $gamesError.set(null);
}

// ============================================================================
// Game Detail Actions
// ============================================================================

/**
 * Set game detail data
 */
export function setGameDetail(game: GameDetail, slug: string) {
  $gameDetail.set(game);
  $currentGameSlug.set(slug);
}

/**
 * Set game detail loading state
 */
export function setGameDetailLoading(loading: boolean) {
  $gameDetailLoading.set(loading);
}

/**
 * Set game detail error state
 */
export function setGameDetailError(error: string | null) {
  $gameDetailError.set(error);
}

/**
 * Clear game detail state
 */
export function clearGameDetailState() {
  $gameDetail.set(null);
  $currentGameSlug.set(null);
  $gameDetailLoading.set(false);
  $gameDetailError.set(null);
}

/**
 * Update game detail data (for optimistic updates)
 */
export function updateGameDetail(updates: Partial<GameDetail>) {
  const currentGame = $gameDetail.get();
  if (currentGame) {
    const updatedGame = { ...currentGame, ...updates };
    $gameDetail.set(updatedGame);
  }
}

// ============================================================================
// Similar Games Actions
// ============================================================================

/**
 * Set similar games data
 */
export function setSimilarGames(games: GameResponse[]) {
  $similarGames.set(games);
}

/**
 * Set similar games loading state
 */
export function setSimilarGamesLoading(loading: boolean) {
  $similarGamesLoading.set(loading);
}

/**
 * Clear similar games state
 */
export function clearSimilarGamesState() {
  $similarGames.set(null);
  $similarGamesLoading.set(false);
}

// ============================================================================
// Global Actions
// ============================================================================

/**
 * Clear all games-related state
 */
export function clearAllGamesState() {
  clearGamesState();
  clearGameDetailState();
  clearSimilarGamesState();
}

// ============================================================================
// Cache Management (Optional Enhancement)
// ============================================================================

/**
 * Cache for game details by slug to avoid refetching
 */
const gameDetailCache = new Map<string, { game: GameDetail; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached game detail if available and not expired
 */
export function getCachedGameDetail(slug: string): GameDetail | null {
  const cached = gameDetailCache.get(slug);

  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    gameDetailCache.delete(slug);
    return null;
  }

  return cached.game;
}

/**
 * Cache game detail data
 */
export function cacheGameDetail(slug: string, game: GameDetail) {
  gameDetailCache.set(slug, {
    game,
    timestamp: Date.now(),
  });
}

/**
 * Clear game detail cache
 */
export function clearGameDetailCache() {
  gameDetailCache.clear();
}

/**
 * Enhanced set game detail with caching
 */
export function setGameDetailWithCache(game: GameDetail, slug: string) {
  setGameDetail(game, slug);
  cacheGameDetail(slug, game);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a specific game is in the current games list
 */
export function isGameInList(gameId: string): boolean {
  const gamesData = $gamesData.get();
  return gamesData?.data.some((gameResponse) => gameResponse.game.id === gameId) || false;
}

/**
 * Get game from current list by ID
 */
export function getGameFromList(gameId: string): GameResponse | null {
  const gamesData = $gamesData.get();
  return gamesData?.data.find((gameResponse) => gameResponse.game.id === gameId) || null;
}

/**
 * Get current pagination info
 */
export function getCurrentPaginationInfo() {
  const gamesData = $gamesData.get();

  if (!gamesData) {
    return {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  return {
    page: gamesData.page,
    limit: gamesData.limit,
    total: gamesData.total,
    totalPages: gamesData.totalPages,
    hasNextPage: gamesData.hasNextPage,
    hasPreviousPage: gamesData.hasPreviousPage,
  };
}

/**
 * Get loading state summary
 */
export function getLoadingState() {
  return {
    games: $gamesLoading.get(),
    gameDetail: $gameDetailLoading.get(),
    similarGames: $similarGamesLoading.get(),
    isAnyLoading: $gamesLoading.get() || $gameDetailLoading.get() || $similarGamesLoading.get(),
  };
}

/**
 * Get error state summary
 */
export function getErrorState() {
  return {
    games: $gamesError.get(),
    gameDetail: $gameDetailError.get(),
    hasAnyError: Boolean($gamesError.get() || $gameDetailError.get()),
  };
}
