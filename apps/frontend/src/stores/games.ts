import { atom } from 'nanostores';
import type { GameResponse, GameDetail, PaginatedGamesResponse } from '@glitch/shared-types';

// ── Games List State

export const $gamesData = atom<PaginatedGamesResponse | null>(null);

export const $gamesLoading = atom<boolean>(false);

export const $gamesError = atom<string | null>(null);

// ── Game Detail State

export const $gameDetail = atom<GameDetail | null>(null);

export const $currentGameSlug = atom<string | null>(null);

export const $gameDetailLoading = atom<boolean>(false);

export const $gameDetailError = atom<string | null>(null);

// ── Similar Games State

export const $similarGames = atom<GameResponse[] | null>(null);

export const $similarGamesLoading = atom<boolean>(false);

// ── Games List Actions

export function setGamesData(data: PaginatedGamesResponse) {
  $gamesData.set(data);
}

export function setGamesLoading(loading: boolean) {
  $gamesLoading.set(loading);
}

export function setGamesError(error: string | null) {
  $gamesError.set(error);
}

export function clearGamesState() {
  $gamesData.set(null);
  $gamesLoading.set(false);
  $gamesError.set(null);
}

// ── Game Detail Actions

export function setGameDetail(game: GameDetail, slug: string) {
  $gameDetail.set(game);
  $currentGameSlug.set(slug);
}

export function setGameDetailLoading(loading: boolean) {
  $gameDetailLoading.set(loading);
}

export function setGameDetailError(error: string | null) {
  $gameDetailError.set(error);
}

export function clearGameDetailState() {
  $gameDetail.set(null);
  $currentGameSlug.set(null);
  $gameDetailLoading.set(false);
  $gameDetailError.set(null);
}

export function updateGameDetail(updates: Partial<GameDetail>) {
  const currentGame = $gameDetail.get();
  if (currentGame) {
    const updatedGame = { ...currentGame, ...updates };
    $gameDetail.set(updatedGame);
  }
}

// ── Similar Games Actions

export function setSimilarGames(games: GameResponse[]) {
  $similarGames.set(games);
}

export function setSimilarGamesLoading(loading: boolean) {
  $similarGamesLoading.set(loading);
}

export function clearSimilarGamesState() {
  $similarGames.set(null);
  $similarGamesLoading.set(false);
}

// ── Aggregate Rating Actions

/** Patch a game's rating/review count across caches; the average must come from a refetch. */
export function patchGameAggregate(slug: string, averageRating?: number, reviewCount?: number) {
  const patch = <T extends GameResponse>(game: T): T =>
    game.game.slug === slug
      ? {
          ...game,
          game: {
            ...game.game,
            averageRating,
            reviewCount: reviewCount ?? game.game.reviewCount,
          },
        }
      : game;

  // Patch the detail atom too, or the score only moves on a full reload.
  const detail = $gameDetail.get();
  if (detail?.game.slug === slug) {
    $gameDetail.set(patch(detail));
  }

  const gamesData = $gamesData.get();
  if (gamesData) {
    $gamesData.set({ ...gamesData, data: gamesData.data.map(patch) });
  }

  const similarGames = $similarGames.get();
  if (similarGames) {
    $similarGames.set(similarGames.map(patch));
  }
}

/** Refetch a game's aggregates and patch cached cards; failures keep the previous number. */
export async function refreshGameAggregate(slug: string): Promise<void> {
  try {
    const { gamesService } = await import('../services/games');
    const detail = await gamesService.getGameBySlug(slug);
    patchGameAggregate(slug, detail.game.averageRating, detail.game.reviewCount);
  } catch {
    // Non-fatal: a stale rating chip is better than a broken page.
  }
}

// ── Global Actions

export function clearAllGamesState() {
  clearGamesState();
  clearGameDetailState();
  clearSimilarGamesState();
}

// ── Cache Management

/** Cache of game details by slug to avoid refetching. */
const gameDetailCache = new Map<string, { game: GameDetail; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

export function cacheGameDetail(slug: string, game: GameDetail) {
  gameDetailCache.set(slug, {
    game,
    timestamp: Date.now(),
  });
}

export function clearGameDetailCache() {
  gameDetailCache.clear();
}

export function setGameDetailWithCache(game: GameDetail, slug: string) {
  setGameDetail(game, slug);
  cacheGameDetail(slug, game);
}

// ── Helper Functions

export function isGameInList(gameId: string): boolean {
  const gamesData = $gamesData.get();
  return gamesData?.data.some((gameResponse) => gameResponse.game.id === gameId) || false;
}

export function getGameFromList(gameId: string): GameResponse | null {
  const gamesData = $gamesData.get();
  return gamesData?.data.find((gameResponse) => gameResponse.game.id === gameId) || null;
}

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

export function getLoadingState() {
  return {
    games: $gamesLoading.get(),
    gameDetail: $gameDetailLoading.get(),
    similarGames: $similarGamesLoading.get(),
    isAnyLoading: $gamesLoading.get() || $gameDetailLoading.get() || $similarGamesLoading.get(),
  };
}

export function getErrorState() {
  return {
    games: $gamesError.get(),
    gameDetail: $gameDetailError.get(),
    hasAnyError: Boolean($gamesError.get() || $gameDetailError.get()),
  };
}
