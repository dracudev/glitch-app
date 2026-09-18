import { atom } from 'nanostores';
import type { ReviewResponse, PaginatedReviewsResponse } from '@glitch/shared-types';

// ── Reviews List State

export const $reviewsData = atom<PaginatedReviewsResponse | null>(null);

export const $reviewsLoading = atom<boolean>(false);

export const $reviewsError = atom<string | null>(null);

// ── Review Detail State

export const $reviewDetail = atom<ReviewResponse | null>(null);

export const $currentReviewId = atom<string | null>(null);

export const $reviewDetailLoading = atom<boolean>(false);

export const $reviewDetailError = atom<string | null>(null);

// ── User's Reviews State

export const $userReviews = atom<PaginatedReviewsResponse | null>(null);

export const $userReviewsLoading = atom<boolean>(false);

export const $currentUserReviewsId = atom<string | null>(null);

// ── Game Reviews State

export const $gameReviews = atom<PaginatedReviewsResponse | null>(null);

export const $gameReviewsLoading = atom<boolean>(false);

/** Keyed by slug, not id: a review's `game.id` is our internal id while `GameBasic.id` is the IGDB id. */
export const $currentGameReviewsSlug = atom<string | null>(null);

// ── Review Actions State (Create, Update, Delete)

export const $reviewActionLoading = atom<boolean>(false);

export const $reviewActionError = atom<string | null>(null);

// ── Reviews List Actions

export function setReviewsData(data: PaginatedReviewsResponse) {
  $reviewsData.set(data);
}

export function setReviewsLoading(loading: boolean) {
  $reviewsLoading.set(loading);
}

export function setReviewsError(error: string | null) {
  $reviewsError.set(error);
}

export function clearReviewsState() {
  $reviewsData.set(null);
  $reviewsLoading.set(false);
  $reviewsError.set(null);
}

export function appendReviewsData(newData: PaginatedReviewsResponse) {
  const currentData = $reviewsData.get();

  if (!currentData) {
    setReviewsData(newData);
    return;
  }

  const mergedData: PaginatedReviewsResponse = {
    ...newData,
    items: [...currentData.items, ...newData.items],
  };

  $reviewsData.set(mergedData);
}

// ── Review Detail Actions

export function setReviewDetail(review: ReviewResponse, reviewId: string) {
  $reviewDetail.set(review);
  $currentReviewId.set(reviewId);
}

export function setReviewDetailLoading(loading: boolean) {
  $reviewDetailLoading.set(loading);
}

export function setReviewDetailError(error: string | null) {
  $reviewDetailError.set(error);
}

export function clearReviewDetailState() {
  $reviewDetail.set(null);
  $currentReviewId.set(null);
  $reviewDetailLoading.set(false);
  $reviewDetailError.set(null);
}

export function updateReviewDetail(updates: Partial<ReviewResponse>) {
  const currentReview = $reviewDetail.get();
  if (currentReview) {
    const updatedReview = { ...currentReview, ...updates };
    $reviewDetail.set(updatedReview);
  }
}

// ── User Reviews Actions

export function setUserReviews(data: PaginatedReviewsResponse, userId: string) {
  $userReviews.set(data);
  $currentUserReviewsId.set(userId);
}

export function appendUserReviews(data: PaginatedReviewsResponse) {
  const currentData = $userReviews.get();

  if (!currentData) {
    $userReviews.set(data);
    return;
  }

  const existingIds = new Set(currentData.items.map((item) => item.id));
  const newItems = data.items.filter((item) => !existingIds.has(item.id));

  $userReviews.set({
    ...data,
    items: [...currentData.items, ...newItems],
  });
}

export function setUserReviewsLoading(loading: boolean) {
  $userReviewsLoading.set(loading);
}

export function clearUserReviewsState() {
  $userReviews.set(null);
  $userReviewsLoading.set(false);
  $currentUserReviewsId.set(null);
}

// ── Game Reviews Actions

/** Set game reviews data; `gameSlug` is optional so a pagination fetch keeps the hydrated key. */
export function setGameReviews(data: PaginatedReviewsResponse, gameSlug?: string) {
  $gameReviews.set(data);
  if (gameSlug) $currentGameReviewsSlug.set(gameSlug);
}

export function appendGameReviews(data: PaginatedReviewsResponse) {
  const currentData = $gameReviews.get();

  if (!currentData) {
    $gameReviews.set(data);
    return;
  }

  const existingIds = new Set(currentData.items.map((item) => item.id));
  const newItems = data.items.filter((item) => !existingIds.has(item.id));

  $gameReviews.set({
    ...data,
    items: [...currentData.items, ...newItems],
  });
}

export function setGameReviewsLoading(loading: boolean) {
  $gameReviewsLoading.set(loading);
}

export function clearGameReviewsState() {
  $gameReviews.set(null);
  $gameReviewsLoading.set(false);
  $currentGameReviewsSlug.set(null);
}

// ── Review Actions (CRUD) Actions

export function setReviewActionLoading(loading: boolean) {
  $reviewActionLoading.set(loading);
}

export function setReviewActionError(error: string | null) {
  $reviewActionError.set(error);
}

export function clearReviewActionState() {
  $reviewActionLoading.set(false);
  $reviewActionError.set(null);
}

// ── Global Actions

export function clearAllReviewsState() {
  clearReviewsState();
  clearReviewDetailState();
  clearUserReviewsState();
  clearGameReviewsState();
  clearReviewActionState();
}

// ── Cache Management

/** Cache of review details by ID to avoid refetching. */
const reviewDetailCache = new Map<string, { review: ReviewResponse; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedReviewDetail(reviewId: string): ReviewResponse | null {
  const cached = reviewDetailCache.get(reviewId);

  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    reviewDetailCache.delete(reviewId);
    return null;
  }

  return cached.review;
}

export function cacheReviewDetail(reviewId: string, review: ReviewResponse) {
  reviewDetailCache.set(reviewId, {
    review,
    timestamp: Date.now(),
  });
}

export function clearReviewDetailCache() {
  reviewDetailCache.clear();
}

export function setReviewDetailWithCache(review: ReviewResponse, reviewId: string) {
  setReviewDetail(review, reviewId);
  cacheReviewDetail(reviewId, review);
}

// ── Optimistic Updates for Like/Unlike

export function optimisticLikeUpdate(reviewId: string, isLiked: boolean) {
  const currentReview = $reviewDetail.get();
  if (currentReview && currentReview.id === reviewId) {
    const updatedStats = {
      ...currentReview.stats,
      likesCount: isLiked
        ? currentReview.stats.likesCount + 1
        : Math.max(0, currentReview.stats.likesCount - 1),
    };

    updateReviewDetail({
      isLiked,
      stats: updatedStats,
    });
  }

  const reviewsData = $reviewsData.get();
  if (reviewsData) {
    const updatedItems = reviewsData.items.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          isLiked,
          stats: {
            ...review.stats,
            likesCount: isLiked
              ? review.stats.likesCount + 1
              : Math.max(0, review.stats.likesCount - 1),
          },
        };
      }
      return review;
    });

    setReviewsData({ ...reviewsData, items: updatedItems });
  }

  const userReviews = $userReviews.get();
  if (userReviews) {
    const updatedItems = userReviews.items.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          isLiked,
          stats: {
            ...review.stats,
            likesCount: isLiked
              ? review.stats.likesCount + 1
              : Math.max(0, review.stats.likesCount - 1),
          },
        };
      }
      return review;
    });

    $userReviews.set({ ...userReviews, items: updatedItems });
  }

  const gameReviews = $gameReviews.get();
  if (gameReviews) {
    const updatedItems = gameReviews.items.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          isLiked,
          stats: {
            ...review.stats,
            likesCount: isLiked
              ? review.stats.likesCount + 1
              : Math.max(0, review.stats.likesCount - 1),
          },
        };
      }
      return review;
    });

    $gameReviews.set({ ...gameReviews, items: updatedItems });
  }
}

// ── Optimistic Updates for Create/Update/Delete

/** Prepend a newly created review to game reviews and main reviews list */
export function addReviewToList(review: ReviewResponse) {
  const gameReviews = $gameReviews.get();
  if (gameReviews && review.game.slug === $currentGameReviewsSlug.get()) {
    $gameReviews.set({
      ...gameReviews,
      items: [review, ...gameReviews.items],
      meta: { ...gameReviews.meta, total: gameReviews.meta.total + 1 },
    });
  }
  const reviewsData = $reviewsData.get();
  if (reviewsData) {
    $reviewsData.set({
      ...reviewsData,
      items: [review, ...reviewsData.items],
      meta: { ...reviewsData.meta, total: reviewsData.meta.total + 1 },
    });
  }
}

export function updateReviewInLists(updated: ReviewResponse) {
  _replaceInList($reviewsData, updated);
  _replaceInList($gameReviews, updated);
  _replaceInList($userReviews, updated);
  if ($currentReviewId.get() === updated.id) {
    $reviewDetail.set(updated);
  }
}

export function removeReviewFromList(reviewId: string) {
  _removeFromList($reviewsData, reviewId);
  _removeFromList($gameReviews, reviewId);
  _removeFromList($userReviews, reviewId);
  if ($currentReviewId.get() === reviewId) {
    $reviewDetail.set(null);
    $currentReviewId.set(null);
  }
}

/** Rewrite the copied author in every cached review after a profile edit. */
export function rewriteReviewAuthors(
  userId: string,
  author: { username: string; displayName: string; avatar?: string },
) {
  const patch = (review: ReviewResponse): ReviewResponse =>
    review.user.id === userId ? { ...review, user: { ...review.user, ...author } } : review;

  for (const atom of [$reviewsData, $gameReviews, $userReviews]) {
    const data = atom.get();
    if (!data) continue;
    const items = data.items.map(patch);
    if (items.some((item, index) => item !== data.items[index])) {
      atom.set({ ...data, items });
    }
  }

  const detail = $reviewDetail.get();
  if (detail?.user.id === userId) {
    $reviewDetail.set(patch(detail));
  }
}

/** Find a review in the client caches (used to learn which game a delete affects) */
export function findReviewById(reviewId: string): ReviewResponse | null {
  const detail = $reviewDetail.get();
  if (detail?.id === reviewId) return detail;

  for (const atom of [$reviewsData, $gameReviews, $userReviews]) {
    const found = atom.get()?.items.find((r) => r.id === reviewId);
    if (found) return found;
  }
  return null;
}

function _replaceInList(
  atom: ReturnType<typeof import('nanostores').atom>,
  updated: ReviewResponse,
) {
  const data = atom.get() as PaginatedReviewsResponse | null;
  if (!data) return;
  atom.set({
    ...data,
    items: data.items.map((r) => (r.id === updated.id ? updated : r)),
  });
}

function _removeFromList(atom: ReturnType<typeof import('nanostores').atom>, reviewId: string) {
  const data = atom.get() as PaginatedReviewsResponse | null;
  if (!data) return;
  const filtered = data.items.filter((r) => r.id !== reviewId);
  if (filtered.length === data.items.length) return;
  atom.set({
    ...data,
    items: filtered,
    meta: { ...data.meta, total: data.meta.total - 1 },
  });
}

// ── Helper Functions

export function isReviewInList(reviewId: string): boolean {
  const reviewsData = $reviewsData.get();
  return reviewsData?.items.some((review) => review.id === reviewId) || false;
}

export function getReviewFromList(reviewId: string): ReviewResponse | null {
  const reviewsData = $reviewsData.get();
  return reviewsData?.items.find((review) => review.id === reviewId) || null;
}

export function getCurrentReviewsPaginationInfo() {
  const reviewsData = $reviewsData.get();

  if (!reviewsData) {
    return {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    };
  }

  return reviewsData.meta;
}

export function getReviewsLoadingState() {
  return {
    reviews: $reviewsLoading.get(),
    reviewDetail: $reviewDetailLoading.get(),
    userReviews: $userReviewsLoading.get(),
    gameReviews: $gameReviewsLoading.get(),
    reviewAction: $reviewActionLoading.get(),
    isAnyLoading:
      $reviewsLoading.get() ||
      $reviewDetailLoading.get() ||
      $userReviewsLoading.get() ||
      $gameReviewsLoading.get() ||
      $reviewActionLoading.get(),
  };
}

export function getReviewsErrorState() {
  return {
    reviews: $reviewsError.get(),
    reviewDetail: $reviewDetailError.get(),
    reviewAction: $reviewActionError.get(),
    hasAnyError: Boolean(
      $reviewsError.get() || $reviewDetailError.get() || $reviewActionError.get(),
    ),
  };
}

// ── Service Integration Actions (User Profile Feature)

export async function loadUserReviews(
  userId: string,
  query: import('@glitch/shared-types').ReviewsQuery = {},
): Promise<void> {
  setUserReviewsLoading(true);

  try {
    const { fetchUserReviews } = await import('../services/reviews');
    const reviews = await fetchUserReviews(userId, query);

    setUserReviews(reviews, userId);
    setUserReviewsLoading(false);
  } catch (error: any) {
    setUserReviewsLoading(false);
    console.error('Failed to load user reviews:', error);
    throw error;
  }
}
