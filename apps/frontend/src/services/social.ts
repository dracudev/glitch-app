import type {
  SocialStats,
  ActivityFeedResponse,
  ActivityFeedQuery,
  FollowResponse,
  MutualFollowsResponse,
  FollowSuggestion,
  FollowSuggestionsQuery,
  ActivityType,
} from '@glitch/shared-types';
import { apiClient } from './api';

// ── Configuration

const SOCIAL_ENDPOINTS = {
  FOLLOW_USER: (userId: string) => `social/follow/${userId}`,
  UNFOLLOW_USER: (userId: string) => `social/follow/${userId}`,
  CHECK_FOLLOWING: (userId: string) => `social/following/${userId}`,
  ACTIVITY_FEED: 'social/feed',
  SOCIAL_STATS: 'social/stats',
  USER_SOCIAL_STATS: (userId: string) => `social/stats/${userId}`,
  FOLLOW_SUGGESTIONS: 'social/suggestions',
  MUTUAL_FOLLOWS: (userId: string) => `social/mutual/${userId}`,
} as const;

// ── Social Service Class

class SocialService {
  /** Follow a user (requires authentication). */
  async followUser(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.post<void>(SOCIAL_ENDPOINTS.FOLLOW_USER(userId));
  }

  /** Unfollow a user (requires authentication). */
  async unfollowUser(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.delete<void>(SOCIAL_ENDPOINTS.UNFOLLOW_USER(userId));
  }

  /** Check whether the current user follows a specific user. */
  async isFollowing(userId: string): Promise<FollowResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<FollowResponse>(SOCIAL_ENDPOINTS.CHECK_FOLLOWING(userId));
  }

  async getActivityFeed(
    query: ActivityFeedQuery = {},
    ssrHeaders?: HeadersInit,
  ): Promise<ActivityFeedResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const endpoint = searchParams.toString()
      ? `${SOCIAL_ENDPOINTS.ACTIVITY_FEED}?${searchParams.toString()}`
      : SOCIAL_ENDPOINTS.ACTIVITY_FEED;

    return apiClient.get<ActivityFeedResponse>(endpoint, {}, ssrHeaders);
  }

  async getActivityFeedByType(
    activityType: ActivityType,
    options: Omit<ActivityFeedQuery, 'type'> = {},
  ): Promise<ActivityFeedResponse> {
    return this.getActivityFeed({
      ...options,
      type: activityType,
    });
  }

  /** Get recent activity feed (last 24 hours). */
  async getRecentActivity(
    options: Omit<ActivityFeedQuery, 'since' | 'until'> = {},
  ): Promise<ActivityFeedResponse> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.getActivityFeed({
      ...options,
      since: yesterday,
    });
  }

  async getCurrentUserSocialStats(): Promise<SocialStats> {
    return apiClient.get<SocialStats>(SOCIAL_ENDPOINTS.SOCIAL_STATS);
  }

  async getUserSocialStats(userId: string): Promise<SocialStats> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<SocialStats>(SOCIAL_ENDPOINTS.USER_SOCIAL_STATS(userId));
  }

  async getFollowSuggestions(query: FollowSuggestionsQuery = {}): Promise<FollowSuggestion[]> {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = searchParams.toString()
      ? `${SOCIAL_ENDPOINTS.FOLLOW_SUGGESTIONS}?${searchParams.toString()}`
      : SOCIAL_ENDPOINTS.FOLLOW_SUGGESTIONS;

    return apiClient.get<FollowSuggestion[]>(endpoint);
  }

  async getMutualFollows(userId: string): Promise<MutualFollowsResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<MutualFollowsResponse>(SOCIAL_ENDPOINTS.MUTUAL_FOLLOWS(userId));
  }

  async batchCheckFollowing(userIds: string[]): Promise<Record<string, boolean>> {
    if (!userIds.length) {
      return {};
    }

    // For now, make individual requests (could be optimized with a batch endpoint)
    const results = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        isFollowing: (await this.isFollowing(userId)).isFollowing,
      })),
    );

    return results.reduce(
      (acc, { userId, isFollowing }) => {
        acc[userId] = isFollowing;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }

  async followMultipleUsers(userIds: string[]): Promise<void> {
    if (!userIds.length) {
      return;
    }

    await Promise.all(userIds.map((userId) => this.followUser(userId)));
  }

  async unfollowMultipleUsers(userIds: string[]): Promise<void> {
    if (!userIds.length) {
      return;
    }

    await Promise.all(userIds.map((userId) => this.unfollowUser(userId)));
  }
}

// ── Singleton Instance

export const socialService = new SocialService();

// ── Individual Function Exports

export const {
  followUser,
  unfollowUser,
  isFollowing,
  getActivityFeed,
  getActivityFeedByType,
  getRecentActivity,
  getCurrentUserSocialStats,
  getUserSocialStats,
  getFollowSuggestions,
  getMutualFollows,
  batchCheckFollowing,
  followMultipleUsers,
  unfollowMultipleUsers,
} = socialService;
