import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import type {
  ReviewResponse,
  PaginatedReviewsResponse,
  ReviewsQuery,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@glitch/shared-types';

import { reviewsService } from '@/services/reviews';
import {
  $reviewsData,
  $reviewsLoading,
  $reviewsError,
  $reviewDetail,
  $reviewDetailLoading,
  $reviewDetailError,
  $userReviews,
  $userReviewsLoading,
  $gameReviews,
  $gameReviewsLoading,
  $reviewActionLoading,
  $reviewActionError,
  setReviewsLoading,
  setReviewsError,
  setReviewsData,
  appendReviewsData,
  setReviewDetailLoading,
  setReviewDetailError,
  setReviewDetail,
  setUserReviews,
  appendUserReviews,
  setUserReviewsLoading,
  setGameReviews,
  setGameReviewsLoading,
  setReviewActionLoading,
  setReviewActionError,
  clearReviewsState,
  clearReviewDetailState,
  clearUserReviewsState,
  clearGameReviewsState,
  optimisticLikeUpdate,
  addReviewToList,
  updateReviewInLists,
  removeReviewFromList,
  findReviewById,
} from '@/stores/reviews';
import { $currentUser } from '@/stores/auth';
import { clearActivityFeedState } from '@/stores/social';
import { adjustViewedProfileReviewsCount } from '@/stores/users';
import { refreshGameAggregate } from '@/stores/games';

// ============================================================================
// Types
// ============================================================================

interface UseReviewsReturn {
  // State
  data: PaginatedReviewsResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReviews: (query?: ReviewsQuery) => Promise<PaginatedReviewsResponse>;
  searchReviews: (
    searchTerm: string,
    options?: Omit<ReviewsQuery, 'search'>,
  ) => Promise<PaginatedReviewsResponse>;
  getTopRatedReviews: (options?: ReviewsQuery) => Promise<PaginatedReviewsResponse>;
  getRecentReviews: (options?: ReviewsQuery) => Promise<PaginatedReviewsResponse>;
  getPopularReviews: (options?: ReviewsQuery) => Promise<PaginatedReviewsResponse>;
  loadMoreReviews: () => Promise<void>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: () => Promise<void>;
}

interface UseReviewDetailReturn {
  // State
  review: ReviewResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReviewDetail: (reviewId: string) => Promise<ReviewResponse>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: (reviewId?: string) => Promise<void>;
}

interface UseUserReviewsReturn {
  // State
  reviews: PaginatedReviewsResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserReviews: (
    userId: string,
    query?: Omit<ReviewsQuery, 'userId'>,
  ) => Promise<PaginatedReviewsResponse>;
  fetchMoreUserReviews: (
    userId: string,
    query?: Omit<ReviewsQuery, 'userId'>,
  ) => Promise<PaginatedReviewsResponse>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: (userId?: string) => Promise<void>;
}

interface UseGameReviewsReturn {
  // State
  reviews: PaginatedReviewsResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGameReviews: (
    gameId: string,
    query?: Omit<ReviewsQuery, 'gameId'>,
  ) => Promise<PaginatedReviewsResponse>;
  clearError: () => void;
  clearData: () => void;

  // Utils
  refetch: (gameId?: string) => Promise<void>;
}

interface UseReviewActionsReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  createReview: (reviewData: CreateReviewRequest) => Promise<ReviewResponse>;
  updateReview: (reviewId: string, updateData: UpdateReviewRequest) => Promise<ReviewResponse>;
  deleteReview: (reviewId: string) => Promise<void>;
  likeReview: (reviewId: string) => Promise<void>;
  unlikeReview: (reviewId: string) => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// Reviews List Hook
// ============================================================================

/**
 * Hook for managing reviews list with filtering, searching, and pagination
 *
 * @example
 * ```tsx
 * function ReviewsList() {
 *   const {
 *     data,
 *     isLoading,
 *     error,
 *     fetchReviews,
 *     searchReviews,
 *     clearError
 *   } = useReviews();
 *
 *   useEffect(() => {
 *     fetchReviews({ page: 1, limit: 12, sortBy: 'rating', sortOrder: 'desc' });
 *   }, []);
 *
 *   const handleSearch = (searchTerm: string) => {
 *     searchReviews(searchTerm, { limit: 20 });
 *   };
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       {data?.items.map(review => (
 *         <ReviewCard key={review.id} review={review} />
 *       ))}
 *       <Pagination meta={data?.meta} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useReviews(): UseReviewsReturn {
  // Subscribe to global reviews stores
  const data = useStore($reviewsData);
  const isLoading = useStore($reviewsLoading);
  const error = useStore($reviewsError);

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchReviews = useCallback(
    async (query: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await reviewsService.getAllReviews(query);
        setReviewsData(response);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setReviewsLoading(false);
      }
    },
    [],
  );

  const searchReviews = useCallback(
    async (
      searchTerm: string,
      options: Omit<ReviewsQuery, 'search'> = {},
    ): Promise<PaginatedReviewsResponse> => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await reviewsService.searchReviews(searchTerm, options);
        setReviewsData(response);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setReviewsLoading(false);
      }
    },
    [],
  );

  const getTopRatedReviews = useCallback(
    async (options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await reviewsService.getTopRatedReviews(options);
        setReviewsData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch top-rated reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setReviewsLoading(false);
      }
    },
    [],
  );

  const getRecentReviews = useCallback(
    async (options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await reviewsService.getRecentReviews(options);
        setReviewsData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch recent reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setReviewsLoading(false);
      }
    },
    [],
  );

  const getPopularReviews = useCallback(
    async (options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await reviewsService.getPopularReviews(options);
        setReviewsData(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch popular reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setReviewsLoading(false);
      }
    },
    [],
  );

  const loadMoreReviews = useCallback(async (): Promise<void> => {
    const currentData = data;
    const currentIsLoading = isLoading;

    // Don't load if already loading or no more pages
    if (currentIsLoading || !currentData || currentData.meta.page >= currentData.meta.totalPages) {
      return;
    }

    setReviewsLoading(true);

    try {
      const nextPage = currentData.meta.page + 1;
      const response = await reviewsService.getAllReviews({
        page: nextPage,
        limit: currentData.meta.limit,
      });

      appendReviewsData(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more reviews';
      setReviewsError(errorMessage);
      throw error;
    } finally {
      setReviewsLoading(false);
    }
  }, [data, isLoading]);

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setReviewsError(null);
  }, []);

  const clearData = useCallback(() => {
    clearReviewsState();
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    // Basic refetch implementation
    if (data) {
      await fetchReviews();
    }
  }, [data, fetchReviews]);

  return {
    // State
    data,
    isLoading,
    error,

    // Actions
    fetchReviews,
    searchReviews,
    getTopRatedReviews,
    getRecentReviews,
    getPopularReviews,
    loadMoreReviews,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

// ============================================================================
// Review Detail Hook
// ============================================================================

/**
 * Hook for managing individual review details
 *
 * @example
 * ```tsx
 * function ReviewDetailPage({ reviewId }: { reviewId: string }) {
 *   const {
 *     review,
 *     isLoading,
 *     error,
 *     fetchReviewDetail,
 *     clearError
 *   } = useReviewDetail();
 *
 *   useEffect(() => {
 *     fetchReviewDetail(reviewId);
 *   }, [reviewId]);
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *   if (!review) return <NotFound />;
 *
 *   return (
 *     <div>
 *       <ReviewHeader review={review} />
 *       <ReviewContent content={review.content} />
 *       <ReviewStats stats={review.stats} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useReviewDetail(): UseReviewDetailReturn {
  // Subscribe to global review detail stores
  const review = useStore($reviewDetail);
  const isLoading = useStore($reviewDetailLoading);
  const error = useStore($reviewDetailError);

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchReviewDetail = useCallback(async (reviewId: string): Promise<ReviewResponse> => {
    setReviewDetailLoading(true);
    setReviewDetailError(null);

    try {
      const response = await reviewsService.getReviewById(reviewId);
      setReviewDetail(response, reviewId);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch review details';
      setReviewDetailError(errorMessage);
      throw error;
    } finally {
      setReviewDetailLoading(false);
    }
  }, []);

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setReviewDetailError(null);
  }, []);

  const clearData = useCallback(() => {
    clearReviewDetailState();
  }, []);

  const refetch = useCallback(
    async (reviewId?: string): Promise<void> => {
      if (reviewId) {
        await fetchReviewDetail(reviewId);
      } else if (review) {
        await fetchReviewDetail(review.id);
      }
    },
    [review, fetchReviewDetail],
  );

  return {
    // State
    review,
    isLoading,
    error,

    // Actions
    fetchReviewDetail,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

// ============================================================================
// User Reviews Hook
// ============================================================================

/**
 * Hook for managing user's reviews
 *
 * @example
 * ```tsx
 * function UserReviewsSection({ userId }: { userId: string }) {
 *   const {
 *     reviews,
 *     isLoading,
 *     error,
 *     fetchUserReviews,
 *     clearError
 *   } = useUserReviews();
 *
 *   useEffect(() => {
 *     fetchUserReviews(userId, { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
 *   }, [userId]);
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *   if (!reviews?.items.length) return <EmptyState />;
 *
 *   return (
 *     <section>
 *       <h3>User Reviews</h3>
 *       <div className="space-y-4">
 *         {reviews.items.map(review => (
 *           <ReviewCard key={review.id} review={review} />
 *         ))}
 *       </div>
 *     </section>
 *   );
 * }
 * ```
 */
export function useUserReviews(): UseUserReviewsReturn {
  // Subscribe to global user reviews stores
  const reviews = useStore($userReviews);
  const isLoading = useStore($userReviewsLoading);
  const error = useStore($reviewsError); // Reuse main reviews error state

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchUserReviews = useCallback(
    async (
      userId: string,
      query: Omit<ReviewsQuery, 'userId'> = {},
    ): Promise<PaginatedReviewsResponse> => {
      setUserReviewsLoading(true);
      setReviewsError(null); // Clear any existing errors

      try {
        const response = await reviewsService.getReviewsByUser(userId, query);
        setUserReviews(response, userId);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch user reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setUserReviewsLoading(false);
      }
    },
    [],
  );

  const fetchMoreUserReviews = useCallback(
    async (
      userId: string,
      query: Omit<ReviewsQuery, 'userId'> = {},
    ): Promise<PaginatedReviewsResponse> => {
      setUserReviewsLoading(true);
      setReviewsError(null); // Clear any existing errors

      try {
        const response = await reviewsService.getReviewsByUser(userId, query);
        appendUserReviews(response); // Append instead of replace
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch more user reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setUserReviewsLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setReviewsError(null);
  }, []);

  const clearData = useCallback(() => {
    clearUserReviewsState();
  }, []);

  const refetch = useCallback(
    async (userId?: string): Promise<void> => {
      // Basic refetch implementation
      if (userId && reviews) {
        await fetchUserReviews(userId);
      }
    },
    [reviews, fetchUserReviews],
  );

  return {
    // State
    reviews,
    isLoading,
    error,

    // Actions
    fetchUserReviews,
    fetchMoreUserReviews,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

// ============================================================================
// Game Reviews Hook
// ============================================================================

/**
 * Hook for managing game's reviews
 *
 * @example
 * ```tsx
 * function GameReviewsSection({ gameId }: { gameId: string }) {
 *   const {
 *     reviews,
 *     isLoading,
 *     error,
 *     fetchGameReviews,
 *     clearError
 *   } = useGameReviews();
 *
 *   useEffect(() => {
 *     fetchGameReviews(gameId, { limit: 10, sortBy: 'rating', sortOrder: 'desc' });
 *   }, [gameId]);
 *
 *   if (error) return <ErrorMessage message={error} onClose={clearError} />;
 *   if (isLoading) return <Loading />;
 *   if (!reviews?.items.length) return <EmptyState />;
 *
 *   return (
 *     <section>
 *       <h3>Game Reviews</h3>
 *       <div className="space-y-4">
 *         {reviews.items.map(review => (
 *           <ReviewCard key={review.id} review={review} />
 *         ))}
 *       </div>
 *     </section>
 *   );
 * }
 * ```
 */
export function useGameReviews(): UseGameReviewsReturn {
  // Subscribe to global game reviews stores
  const reviews = useStore($gameReviews);
  const isLoading = useStore($gameReviewsLoading);
  const error = useStore($reviewsError); // Reuse main reviews error state

  // ============================================================================
  // API Actions
  // ============================================================================

  const fetchGameReviews = useCallback(
    async (
      gameId: string,
      query: Omit<ReviewsQuery, 'gameId'> = {},
    ): Promise<PaginatedReviewsResponse> => {
      setGameReviewsLoading(true);
      setReviewsError(null); // Clear any existing errors

      try {
        const response = await reviewsService.getReviewsByGame(gameId, query);
        // No slug here: the game page owns the key, so paginating must not
        // overwrite it with the anchor id passed in.
        setGameReviews(response);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch game reviews';
        setReviewsError(errorMessage);
        throw error;
      } finally {
        setGameReviewsLoading(false);
      }
    },
    [],
  );

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setReviewsError(null);
  }, []);

  const clearData = useCallback(() => {
    clearGameReviewsState();
  }, []);

  const refetch = useCallback(
    async (gameId?: string): Promise<void> => {
      // Basic refetch implementation
      if (gameId && reviews) {
        await fetchGameReviews(gameId);
      }
    },
    [reviews, fetchGameReviews],
  );

  return {
    // State
    reviews,
    isLoading,
    error,

    // Actions
    fetchGameReviews,
    clearError,
    clearData,

    // Utils
    refetch,
  };
}

/**
 * The current user's own review for a game, if they have one.
 *
 * Reads the cached game reviews first (instant, and already updated by
 * create/update), then falls back to a targeted fetch for a review that is not
 * on the first page of the game's reviews.
 */
export function useMyReviewForGame(gameId?: string): ReviewResponse | null {
  const user = useStore($currentUser);
  const gameReviews = useStore($gameReviews);
  const [fetched, setFetched] = useState<ReviewResponse | null>(null);

  const userId = user?.id;
  const fromStore = userId ? (gameReviews?.items.find((r) => r.user.id === userId) ?? null) : null;

  useEffect(() => {
    if (!userId || !gameId) {
      setFetched(null);
      return;
    }

    let cancelled = false;
    reviewsService
      .getReviewsByGame(gameId, { userId, limit: 1 })
      .then((response) => {
        if (!cancelled) setFetched(response.items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, gameId]);

  return fromStore ?? fetched;
}

// ============================================================================
// Review Actions Hook (CRUD + Like/Unlike)
// ============================================================================
/**
 * Hook for managing review actions (create, update, delete, like, unlike)
 *
 * @example
 * ```tsx
 * function ReviewActionsProvider({ children }) {
 *   const {
 *     isLoading,
 *     error,
 *     createReview,
 *     updateReview,
 *     deleteReview,
 *     likeReview,
 *     clearError
 *   } = useReviewActions();
 *
 *   const handleCreateReview = async (reviewData) => {
 *     try {
 *       const newReview = await createReview(reviewData);
 *       // Handle success
 *     } catch (err) {
 *       // Error is already in state
 *     }
 *   };
 *
 *   return (
 *     <ReviewActionsContext.Provider value={{
 *       createReview: handleCreateReview,
 *       updateReview,
 *       deleteReview,
 *       likeReview,
 *       isLoading,
 *       error,
 *       clearError
 *     }}>
 *       {children}
 *     </ReviewActionsContext.Provider>
 *   );
 * }
 * ```
 */
export function useReviewActions(): UseReviewActionsReturn {
  // Subscribe to global review action stores
  const isLoading = useStore($reviewActionLoading);
  const error = useStore($reviewActionError);

  // ============================================================================
  // API Actions
  // ============================================================================

  const createReview = useCallback(
    async (reviewData: CreateReviewRequest): Promise<ReviewResponse> => {
      setReviewActionLoading(true);
      setReviewActionError(null);

      try {
        const response = await reviewsService.createReview(reviewData);
        addReviewToList(response);
        adjustViewedProfileReviewsCount(response.user.id, 1);
        clearActivityFeedState();
        void refreshGameAggregate(response.game.slug);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create review';
        setReviewActionError(errorMessage);
        throw error;
      } finally {
        setReviewActionLoading(false);
      }
    },
    [],
  );

  const updateReview = useCallback(
    async (reviewId: string, updateData: UpdateReviewRequest): Promise<ReviewResponse> => {
      setReviewActionLoading(true);
      setReviewActionError(null);

      try {
        const response = await reviewsService.updateReview(reviewId, updateData);
        updateReviewInLists(response);
        clearActivityFeedState();
        void refreshGameAggregate(response.game.slug);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update review';
        setReviewActionError(errorMessage);
        throw error;
      } finally {
        setReviewActionLoading(false);
      }
    },
    [],
  );

  const deleteReview = useCallback(async (reviewId: string): Promise<void> => {
    setReviewActionLoading(true);
    setReviewActionError(null);

    try {
      // Read the review before it is removed from the caches - its game slug is
      // what tells us whose aggregate rating went stale.
      const affected = findReviewById(reviewId);
      await reviewsService.deleteReview(reviewId);
      removeReviewFromList(reviewId);
      adjustViewedProfileReviewsCount($currentUser.get()?.id, -1);
      clearActivityFeedState();
      if (affected) void refreshGameAggregate(affected.game.slug);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
      setReviewActionError(errorMessage);
      throw error;
    } finally {
      setReviewActionLoading(false);
    }
  }, []);

  const likeReview = useCallback(async (reviewId: string): Promise<void> => {
    // Optimistic update
    optimisticLikeUpdate(reviewId, true);

    try {
      await reviewsService.likeReview(reviewId);
      clearActivityFeedState();
    } catch (error) {
      // Revert optimistic update on error
      optimisticLikeUpdate(reviewId, false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to like review';
      setReviewActionError(errorMessage);
      throw error;
    }
  }, []);

  const unlikeReview = useCallback(async (reviewId: string): Promise<void> => {
    // Optimistic update
    optimisticLikeUpdate(reviewId, false);

    try {
      await reviewsService.unlikeReview(reviewId);
      clearActivityFeedState();
    } catch (error) {
      // Revert optimistic update on error
      optimisticLikeUpdate(reviewId, true);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlike review';
      setReviewActionError(errorMessage);
      throw error;
    }
  }, []);

  // ============================================================================
  // Utility Actions
  // ============================================================================

  const clearError = useCallback(() => {
    setReviewActionError(null);
  }, []);

  return {
    // State
    isLoading,
    error,

    // Actions
    createReview,
    updateReview,
    deleteReview,
    likeReview,
    unlikeReview,
    clearError,
  };
}

// ============================================================================
// Specialized Review Hooks
// ============================================================================

/**
 * Hook for fetching and managing featured reviews (top-rated)
 */
export function useFeaturedReviews(limit: number = 12) {
  const { data, isLoading, error, getTopRatedReviews, clearError } = useReviews();

  const fetchFeaturedReviews = useCallback(async () => {
    return getTopRatedReviews({
      limit,
      minRating: 8.0,
      sortBy: 'rating',
      sortOrder: 'desc',
      isPublished: true,
    });
  }, [getTopRatedReviews, limit]);

  useEffect(() => {
    fetchFeaturedReviews();
  }, [fetchFeaturedReviews]);

  return {
    reviews: data?.items || [],
    isLoading,
    error,
    refetch: fetchFeaturedReviews,
    clearError,
  };
}

/**
 * Hook for fetching and managing latest reviews
 */
export function useLatestReviews(limit: number = 12) {
  const { data, isLoading, error, getRecentReviews, clearError } = useReviews();

  const fetchLatestReviews = useCallback(async () => {
    return getRecentReviews({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isPublished: true,
    });
  }, [getRecentReviews, limit]);

  useEffect(() => {
    fetchLatestReviews();
  }, [fetchLatestReviews]);

  return {
    reviews: data?.items || [],
    isLoading,
    error,
    refetch: fetchLatestReviews,
    clearError,
  };
}

/**
 * Hook for fetching and managing trending reviews (most liked)
 */
export function useTrendingReviews(limit: number = 12) {
  const { data, isLoading, error, getPopularReviews, clearError } = useReviews();

  const fetchTrendingReviews = useCallback(async () => {
    return getPopularReviews({
      limit,
      sortBy: 'likesCount',
      sortOrder: 'desc',
      isPublished: true,
    });
  }, [getPopularReviews, limit]);

  useEffect(() => {
    fetchTrendingReviews();
  }, [fetchTrendingReviews]);

  return {
    reviews: data?.items || [],
    isLoading,
    error,
    refetch: fetchTrendingReviews,
    clearError,
  };
}
