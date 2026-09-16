import type {
  ReviewResponse,
  PaginatedReviewsResponse,
  ReviewsQuery,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@glitch/shared-types';
import { apiClient } from './api';

// ============================================================================
// Configuration
// ============================================================================

const REVIEWS_ENDPOINTS = {
  REVIEWS: 'reviews',
  REVIEW_BY_ID: (id: string) => `reviews/${id}`,
  REVIEWS_BY_GAME: (gameId: string) => `reviews/game/${gameId}`,
  REVIEWS_BY_USER: (userId: string) => `reviews/user/${userId}`,
  REVIEW_BY_USER_AND_GAME: (userId: string, gameId: string) =>
    `reviews/user/${userId}/game/${gameId}`,
  LIKE_REVIEW: (id: string) => `reviews/${id}/like`,
} as const;

// ============================================================================
// Reviews Service Class
// ============================================================================

class ReviewsService {
  /**
   * Fetch all reviews with optional filtering, searching, and pagination
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * // Get all reviews with default pagination
   * const reviewsResponse = await reviewsService.getAllReviews();
   *
   * // Get reviews with filters
   * const filteredReviews = await reviewsService.getAllReviews({
   *   page: 1,
   *   limit: 12,
   *   search: 'amazing game',
   *   gameId: 'game-id',
   *   minRating: 8.0,
   *   isPublished: true,
   *   sortBy: 'rating',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getAllReviews(
    query: ReviewsQuery = {},
    ssrHeaders?: HeadersInit,
  ): Promise<PaginatedReviewsResponse> {
    const searchParams = new URLSearchParams();

    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = searchParams.toString()
      ? `${REVIEWS_ENDPOINTS.REVIEWS}?${searchParams.toString()}`
      : REVIEWS_ENDPOINTS.REVIEWS;

    return apiClient.get<PaginatedReviewsResponse>(endpoint, {}, ssrHeaders);
  }

  /**
   * Fetch a single review by its ID
   *
   * @param reviewId - The review's unique identifier
   * @returns Promise resolving to review information
   *
   * @example
   * ```typescript
   * const review = await reviewsService.getReviewById('review-id');
   * ```
   */
  async getReviewById(
    reviewId: string,
    ssrHeaders?: HeadersInit,
  ): Promise<ReviewResponse> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.get<ReviewResponse>(
      REVIEWS_ENDPOINTS.REVIEW_BY_ID(reviewId),
      {},
      ssrHeaders,
    );
  }

  /**
   * Fetch reviews for a specific game
   *
   * @param gameId - The game's unique identifier
   * @param query - Additional query parameters
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const gameReviews = await reviewsService.getReviewsByGame('game-id', {
   *   limit: 20,
   *   sortBy: 'rating',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getReviewsByGame(
    gameId: string,
    query: Omit<ReviewsQuery, 'gameId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const searchParams = new URLSearchParams();

    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = searchParams.toString()
      ? `${REVIEWS_ENDPOINTS.REVIEWS_BY_GAME(gameId)}?${searchParams.toString()}`
      : REVIEWS_ENDPOINTS.REVIEWS_BY_GAME(gameId);

    return apiClient.get<PaginatedReviewsResponse>(endpoint, {});
  }

  /**
   * Fetch reviews by a specific user
   *
   * @param userId - The user's unique identifier
   * @param query - Additional query parameters
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const userReviews = await reviewsService.getReviewsByUser('user-id', {
   *   limit: 10,
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getReviewsByUser(
    userId: string,
    query: Omit<ReviewsQuery, 'userId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const searchParams = new URLSearchParams();

    // Add query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = searchParams.toString()
      ? `${REVIEWS_ENDPOINTS.REVIEWS_BY_USER(userId)}?${searchParams.toString()}`
      : REVIEWS_ENDPOINTS.REVIEWS_BY_USER(userId);

    return apiClient.get<PaginatedReviewsResponse>(endpoint, {});
  }

  /**
   * Fetch reviews by a specific user (alias for User Profile feature)
   *
   * @param userId - The user's unique identifier
   * @param query - Query parameters for pagination and filtering
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const userReviews = await reviewsService.fetchUserReviews('user-id', {
   *   page: 1,
   *   limit: 10
   * });
   * ```
   */
  async fetchUserReviews(
    userId: string,
    query: Omit<ReviewsQuery, 'userId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    return this.getReviewsByUser(userId, query);
  }

  /**
   * Get a specific user's review for a specific game
   *
   * @param userId - The user's unique identifier
   * @param gameId - The game's unique identifier
   * @returns Promise resolving to review or null if not found
   *
   * @example
   * ```typescript
   * const userGameReview = await reviewsService.getReviewByUserAndGame('user-id', 'game-id');
   * ```
   */
  async getReviewByUserAndGame(userId: string, gameId: string): Promise<ReviewResponse | null> {
    if (!userId || !gameId) {
      throw new Error('User ID and Game ID are required');
    }

    try {
      return await apiClient.get<ReviewResponse>(
        REVIEWS_ENDPOINTS.REVIEW_BY_USER_AND_GAME(userId, gameId),
        {},
      );
    } catch (error: any) {
      // Return null if review not found (404)
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new review (requires authentication)
   *
   * @param reviewData - The review data
   * @returns Promise resolving to created review
   *
   * @example
   * ```typescript
   * const newReview = await reviewsService.createReview({
   *   title: 'Amazing Game!',
   *   content: 'This game exceeded all my expectations...',
   *   rating: 9.5,
   *   gameId: 'game-id',
   *   isPublished: true,
   *   isSpoiler: false
   * });
   * ```
   */
  async createReview(reviewData: CreateReviewRequest): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>(REVIEWS_ENDPOINTS.REVIEWS, reviewData);
  }

  /**
   * Update an existing review (requires authentication and ownership)
   *
   * @param reviewId - The review's unique identifier
   * @param updateData - The review update data
   * @returns Promise resolving to updated review
   *
   * @example
   * ```typescript
   * const updatedReview = await reviewsService.updateReview('review-id', {
   *   title: 'Updated Review Title',
   *   content: 'Updated review content...',
   *   rating: 8.5
   * });
   * ```
   */
  async updateReview(reviewId: string, updateData: UpdateReviewRequest): Promise<ReviewResponse> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.patch<ReviewResponse>(REVIEWS_ENDPOINTS.REVIEW_BY_ID(reviewId), updateData);
  }

  /**
   * Delete a review (requires authentication and ownership)
   *
   * @param reviewId - The review's unique identifier
   * @returns Promise resolving when review is deleted
   *
   * @example
   * ```typescript
   * await reviewsService.deleteReview('review-id');
   * ```
   */
  async deleteReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.delete<void>(REVIEWS_ENDPOINTS.REVIEW_BY_ID(reviewId));
  }

  /**
   * Like a review (requires authentication)
   *
   * @param reviewId - The review's unique identifier
   * @returns Promise resolving when review is liked
   *
   * @example
   * ```typescript
   * await reviewsService.likeReview('review-id');
   * ```
   */
  async likeReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.post<void>(REVIEWS_ENDPOINTS.LIKE_REVIEW(reviewId));
  }

  /**
   * Unlike a review (requires authentication)
   *
   * @param reviewId - The review's unique identifier
   * @returns Promise resolving when review is unliked
   *
   * @example
   * ```typescript
   * await reviewsService.unlikeReview('review-id');
   * ```
   */
  async unlikeReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.delete<void>(REVIEWS_ENDPOINTS.LIKE_REVIEW(reviewId));
  }

  /**
   * Search reviews by content
   *
   * @param searchTerm - The search term to match against review titles and content
   * @param options - Additional search options
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const searchResults = await reviewsService.searchReviews('epic adventure', {
   *   limit: 20,
   *   sortBy: 'rating',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async searchReviews(
    searchTerm: string,
    options: Omit<ReviewsQuery, 'search'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (!searchTerm.trim()) {
      throw new Error('Search term is required');
    }

    return this.getAllReviews({
      ...options,
      search: searchTerm.trim(),
    });
  }

  /**
   * Get top-rated reviews
   *
   * @param options - Query options for customizing the results
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const topReviews = await reviewsService.getTopRatedReviews({
   *   limit: 50,
   *   minRating: 8.5
   * });
   * ```
   */
  async getTopRatedReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'rating',
      sortOrder: 'desc',
      minRating: options.minRating || 7.0,
      isPublished: true,
    });
  }

  /**
   * Get recent reviews
   *
   * @param options - Query options for customizing the results
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const recentReviews = await reviewsService.getRecentReviews({
   *   limit: 20
   * });
   * ```
   */
  async getRecentReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isPublished: true,
    });
  }

  /**
   * Get most liked reviews
   *
   * @param options - Query options for customizing the results
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const popularReviews = await reviewsService.getPopularReviews({
   *   limit: 30
   * });
   * ```
   */
  async getPopularReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'likesCount',
      sortOrder: 'desc',
      isPublished: true,
    });
  }

  /**
   * Get reviews by rating range
   *
   * @param minRating - Minimum rating threshold
   * @param maxRating - Maximum rating threshold
   * @param options - Additional query options
   * @returns Promise resolving to paginated reviews response
   *
   * @example
   * ```typescript
   * const highRatedReviews = await reviewsService.getReviewsByRatingRange(8.0, 10.0, {
   *   limit: 25,
   *   sortBy: 'rating',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getReviewsByRatingRange(
    minRating: number,
    maxRating: number,
    options: Omit<ReviewsQuery, 'minRating' | 'maxRating'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (minRating < 0 || maxRating > 10 || minRating > maxRating) {
      throw new Error(
        'Invalid rating range. Ratings must be between 0-10 and minRating <= maxRating',
      );
    }

    return this.getAllReviews({
      ...options,
      minRating,
      maxRating,
      isPublished: true,
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default reviews service instance
 */
export const reviewsService = new ReviewsService();

/**
 * Create a new reviews service instance (for testing purposes)
 */
export function createReviewsService(): ReviewsService {
  return new ReviewsService();
}

// ============================================================================
// Named Exports for Individual Functions
// ============================================================================

export const getAllReviews = reviewsService.getAllReviews.bind(reviewsService);
export const getReviewById = reviewsService.getReviewById.bind(reviewsService);
export const getReviewsByGame = reviewsService.getReviewsByGame.bind(reviewsService);
export const getReviewsByUser = reviewsService.getReviewsByUser.bind(reviewsService);
export const fetchUserReviews = reviewsService.fetchUserReviews.bind(reviewsService);
export const getReviewByUserAndGame = reviewsService.getReviewByUserAndGame.bind(reviewsService);
export const createReview = reviewsService.createReview.bind(reviewsService);
export const updateReview = reviewsService.updateReview.bind(reviewsService);
export const deleteReview = reviewsService.deleteReview.bind(reviewsService);
export const likeReview = reviewsService.likeReview.bind(reviewsService);
export const unlikeReview = reviewsService.unlikeReview.bind(reviewsService);
export const searchReviews = reviewsService.searchReviews.bind(reviewsService);
export const getTopRatedReviews = reviewsService.getTopRatedReviews.bind(reviewsService);
export const getRecentReviews = reviewsService.getRecentReviews.bind(reviewsService);
export const getPopularReviews = reviewsService.getPopularReviews.bind(reviewsService);
export const getReviewsByRatingRange = reviewsService.getReviewsByRatingRange.bind(reviewsService);
