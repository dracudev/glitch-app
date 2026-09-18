import type {
  UserResponse,
  UserProfile,
  UpdateProfileRequest,
  UsersQuery,
  PaginatedResponse,
} from '@glitch/shared-types';
import { apiClient } from './api';
// Aliased: this module re-exports its own `getAvatarUrl` wrapper below.
import { getAvatarUrl as resolveAvatarUrl } from '@/lib/avatar';

// ── Configuration

const USERS_ENDPOINTS = {
  GET_USERS: 'users',
  GET_USER_BY_ID: (userId: string) => `users/${userId}`,
  GET_USER_BY_USERNAME: (username: string) => `users/username/${username}`,
  GET_CURRENT_USER_PROFILE: 'users/me',
  UPDATE_PROFILE: 'users/profile',
  GET_USER_PROFILE: (userId: string) => `users/${userId}/profile`,
  GET_USER_PROFILE_BY_USERNAME: (username: string) => `users/profile/${username}`,
  GET_USER_FOLLOWERS: (username: string) => `users/profile/${username}/followers`,
  GET_USER_FOLLOWING: (username: string) => `users/profile/${username}/following`,
} as const;

// ── Users Service Class

class UsersService {
  async getUsers(query: UsersQuery = {}): Promise<PaginatedResponse<UserResponse>> {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = searchParams.toString()
      ? `${USERS_ENDPOINTS.GET_USERS}?${searchParams.toString()}`
      : USERS_ENDPOINTS.GET_USERS;

    return apiClient.get<PaginatedResponse<UserResponse>>(endpoint);
  }

  async getUserById(userId: string): Promise<UserResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<UserResponse>(USERS_ENDPOINTS.GET_USER_BY_ID(userId));
  }

  async getUserByUsername(username: string): Promise<UserResponse> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<UserResponse>(USERS_ENDPOINTS.GET_USER_BY_USERNAME(username));
  }

  /** Get current user's detailed profile (requires authentication). */
  async getCurrentUserProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_CURRENT_USER_PROFILE);
  }

  /** Update current user's profile (requires authentication). */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
    if (!profileData || Object.keys(profileData).length === 0) {
      throw new Error('Profile data is required');
    }

    return apiClient.patch<UserProfile>(USERS_ENDPOINTS.UPDATE_PROFILE, profileData);
  }

  /** Get a user's public profile. */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_USER_PROFILE(userId));
  }

  async fetchUserProfile(username: string): Promise<UserProfile> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_USER_PROFILE_BY_USERNAME(username));
  }

  async fetchUserFollowers(username: string): Promise<PaginatedResponse<UserResponse>> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<PaginatedResponse<UserResponse>>(
      USERS_ENDPOINTS.GET_USER_FOLLOWERS(username),
    );
  }

  async fetchUserFollowing(username: string): Promise<PaginatedResponse<UserResponse>> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<PaginatedResponse<UserResponse>>(
      USERS_ENDPOINTS.GET_USER_FOLLOWING(username),
    );
  }

  async searchUsers(
    searchQuery: string,
    options: Omit<UsersQuery, 'search'> = {},
  ): Promise<PaginatedResponse<UserResponse>> {
    if (!searchQuery.trim()) {
      throw new Error('Search query is required');
    }

    return this.getUsers({
      ...options,
      search: searchQuery.trim(),
    });
  }

  async getUsersPage(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<UserResponse>> {
    return this.getUsers({ page, limit });
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    try {
      await this.getUserByUsername(username);
      return false;
    } catch (error) {
      // If user not found (404), username is available
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return true;
      }
      throw error;
    }
  }

  async getBatchUsers(userIds: string[]): Promise<UserResponse[]> {
    if (!userIds.length) {
      return [];
    }

    // For now, make individual requests (could be optimized with a batch endpoint)
    const userPromises = userIds.map((userId) => this.getUserById(userId));

    try {
      return await Promise.all(userPromises);
    } catch (error) {
      // Handle partial failures - return successful requests only
      const results = await Promise.allSettled(userPromises);
      return results
        .filter(
          (result): result is PromiseFulfilledResult<UserResponse> => result.status === 'fulfilled',
        )
        .map((result) => result.value);
    }
  }

  /** Get a user's display name, falling back to username. */
  getDisplayName(user: UserResponse | string): string {
    if (typeof user === 'string') {
      // If only ID provided, we can't get display name without API call
      return user;
    }

    return user.displayName || user.username || 'Anonymous User';
  }

  /** Get a user's avatar URL; size is in pixels. */
  getAvatarUrl(user: UserResponse, size: number = 40): string {
    return resolveAvatarUrl(user, size);
  }
}

// ── Singleton Instance

export const usersService = new UsersService();

// ── Individual Function Exports

export const {
  getUsers,
  getUserById,
  getUserByUsername,
  getCurrentUserProfile,
  updateProfile,
  getUserProfile,
  fetchUserProfile,
  fetchUserFollowers,
  fetchUserFollowing,
  searchUsers,
  getUsersPage,
  isUsernameAvailable,
  getBatchUsers,
  getDisplayName,
  getAvatarUrl,
} = usersService;
