import type {
  ReviewResponse,
  PaginatedReviewsResponse,
  ReviewsQuery,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@glitch/shared-types';
import { apiClient } from './api';

// ── Configuration

const REVIEWS_ENDPOINTS = {
  REVIEWS: 'reviews',
  REVIEW_BY_ID: (id: string) => `reviews/${id}`,
  REVIEWS_BY_GAME: (gameId: string) => `reviews/game/${gameId}`,
  REVIEWS_BY_USER: (userId: string) => `reviews/user/${userId}`,
  REVIEW_BY_USER_AND_GAME: (userId: string, gameId: string) =>
    `reviews/user/${userId}/game/${gameId}`,
  LIKE_REVIEW: (id: string) => `reviews/${id}/like`,
} as const;

// ── Reviews Service Class

class ReviewsService {
  async getAllReviews(
    query: ReviewsQuery = {},
    ssrHeaders?: HeadersInit,
  ): Promise<PaginatedReviewsResponse> {
    const searchParams = new URLSearchParams();

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

  async getReviewsByGame(
    gameId: string,
    query: Omit<ReviewsQuery, 'gameId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    const searchParams = new URLSearchParams();

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

  async getReviewsByUser(
    userId: string,
    query: Omit<ReviewsQuery, 'userId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const searchParams = new URLSearchParams();

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

  /** Alias of getReviewsByUser for the User Profile feature. */
  async fetchUserReviews(
    userId: string,
    query: Omit<ReviewsQuery, 'userId'> = {},
  ): Promise<PaginatedReviewsResponse> {
    return this.getReviewsByUser(userId, query);
  }

  /** Get a user's review for a game, or null if not found. */
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

  /** Create a new review (requires authentication). */
  async createReview(reviewData: CreateReviewRequest): Promise<ReviewResponse> {
    return apiClient.post<ReviewResponse>(REVIEWS_ENDPOINTS.REVIEWS, reviewData);
  }

  /** Update an existing review (requires authentication and ownership). */
  async updateReview(reviewId: string, updateData: UpdateReviewRequest): Promise<ReviewResponse> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.patch<ReviewResponse>(REVIEWS_ENDPOINTS.REVIEW_BY_ID(reviewId), updateData);
  }

  /** Delete a review (requires authentication and ownership). */
  async deleteReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.delete<void>(REVIEWS_ENDPOINTS.REVIEW_BY_ID(reviewId));
  }

  /** Like a review (requires authentication). */
  async likeReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.post<void>(REVIEWS_ENDPOINTS.LIKE_REVIEW(reviewId));
  }

  /** Unlike a review (requires authentication). */
  async unlikeReview(reviewId: string): Promise<void> {
    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    return apiClient.delete<void>(REVIEWS_ENDPOINTS.LIKE_REVIEW(reviewId));
  }

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

  async getTopRatedReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'rating',
      sortOrder: 'desc',
      minRating: options.minRating || 7.0,
      isPublished: true,
    });
  }

  async getRecentReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isPublished: true,
    });
  }

  async getPopularReviews(options: ReviewsQuery = {}): Promise<PaginatedReviewsResponse> {
    return this.getAllReviews({
      ...options,
      sortBy: 'likesCount',
      sortOrder: 'desc',
      isPublished: true,
    });
  }

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

// ── Singleton Instance

export const reviewsService = new ReviewsService();

/** Create a new reviews service instance (for testing). */
export function createReviewsService(): ReviewsService {
  return new ReviewsService();
}

// ── Named Exports for Individual Functions

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
