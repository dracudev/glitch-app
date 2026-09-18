import type {
  AdminCreateUserInput,
  AdminStats,
  AdminUpdateUserInput,
  AdminUser,
  AdminUsersQuery,
  PaginatedResponse,
  PaginatedReviewsResponse,
  ReviewsQuery,
  UpdateReviewRequest,
  ReviewResponse,
} from '@glitch/shared-types';
import { apiClient } from './api';

/** Admin panel data access. Every endpoint is backend-guarded by RolesGuard; the SSR guard only hides the shell. */

const ADMIN_ENDPOINTS = {
  STATS: 'admin/stats',
  USERS: 'admin/users',
  USER_BY_ID: (userId: string) => `admin/users/${userId}`,
  REVIEWS: 'reviews',
  REVIEW_BY_ID: (reviewId: string) => `reviews/${reviewId}`,
} as const;

function withQuery(endpoint: string, query: object): string {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString() ? `${endpoint}?${searchParams.toString()}` : endpoint;
}

export async function getAdminStats(ssrHeaders?: HeadersInit): Promise<AdminStats> {
  return apiClient.get<AdminStats>(ADMIN_ENDPOINTS.STATS, {}, ssrHeaders);
}

export async function getAdminUsers(
  query: AdminUsersQuery = {},
  ssrHeaders?: HeadersInit,
): Promise<PaginatedResponse<AdminUser>> {
  return apiClient.get<PaginatedResponse<AdminUser>>(
    withQuery(ADMIN_ENDPOINTS.USERS, query),
    {},
    ssrHeaders,
  );
}

export async function createAdminUser(input: AdminCreateUserInput): Promise<AdminUser> {
  return apiClient.post<AdminUser>(ADMIN_ENDPOINTS.USERS, input);
}

export async function updateAdminUser(
  userId: string,
  input: AdminUpdateUserInput,
): Promise<AdminUser> {
  return apiClient.patch<AdminUser>(ADMIN_ENDPOINTS.USER_BY_ID(userId), input);
}

export async function deleteAdminUser(userId: string): Promise<void> {
  return apiClient.delete<void>(ADMIN_ENDPOINTS.USER_BY_ID(userId));
}

/** Review moderation reuses the public review endpoints; no admin-specific review routes exist. */
export async function getAdminReviews(
  query: ReviewsQuery = {},
  ssrHeaders?: HeadersInit,
): Promise<PaginatedReviewsResponse> {
  return apiClient.get<PaginatedReviewsResponse>(
    withQuery(ADMIN_ENDPOINTS.REVIEWS, query),
    {},
    ssrHeaders,
  );
}

export async function updateAdminReview(
  reviewId: string,
  input: UpdateReviewRequest,
): Promise<ReviewResponse> {
  return apiClient.patch<ReviewResponse>(ADMIN_ENDPOINTS.REVIEW_BY_ID(reviewId), input);
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  return apiClient.delete<void>(ADMIN_ENDPOINTS.REVIEW_BY_ID(reviewId));
}
