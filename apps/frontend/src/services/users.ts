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

// ============================================================================
// Configuration
// ============================================================================

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

// ============================================================================
// Users Service Class
// ============================================================================

class UsersService {
  /**
   * Get paginated list of users
   *
   * @param query - Optional query parameters for pagination and filtering
   * @returns Promise resolving to paginated users response
   *
   * @example
   * ```typescript
   * const users = await usersService.getUsers({ page: 1, limit: 20, search: 'john' });
   * console.log(users.items.length); // Number of users
   * ```
   */
  async getUsers(query: UsersQuery = {}): Promise<PaginatedResponse<UserResponse>> {
    const searchParams = new URLSearchParams();

    // Add query parameters
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

  /**
   * Get user by ID
   *
   * @param userId - The user's unique identifier
   * @returns Promise resolving to user response
   *
   * @example
   * ```typescript
   * const user = await usersService.getUserById('user-id');
   * console.log(user.username);
   * ```
   */
  async getUserById(userId: string): Promise<UserResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<UserResponse>(USERS_ENDPOINTS.GET_USER_BY_ID(userId));
  }

  /**
   * Get user by username
   *
   * @param username - The user's username
   * @returns Promise resolving to user response
   *
   * @example
   * ```typescript
   * const user = await usersService.getUserByUsername('johndoe');
   * console.log(user.displayName);
   * ```
   */
  async getUserByUsername(username: string): Promise<UserResponse> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<UserResponse>(USERS_ENDPOINTS.GET_USER_BY_USERNAME(username));
  }

  /**
   * Get current user's detailed profile (requires authentication)
   *
   * @returns Promise resolving to current user's profile
   *
   * @example
   * ```typescript
   * const profile = await usersService.getCurrentUserProfile();
   * console.log(profile.email); // Only available for current user
   * ```
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_CURRENT_USER_PROFILE);
  }

  /**
   * Update current user's profile (requires authentication)
   *
   * @param profileData - Profile data to update
   * @returns Promise resolving to updated user profile
   *
   * @example
   * ```typescript
   * const updated = await usersService.updateProfile({
   *   displayName: 'John Doe',
   *   bio: 'Gaming enthusiast',
   * });
   * ```
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
    if (!profileData || Object.keys(profileData).length === 0) {
      throw new Error('Profile data is required');
    }

    return apiClient.patch<UserProfile>(USERS_ENDPOINTS.UPDATE_PROFILE, profileData);
  }

  /**
   * Get user's public profile
   *
   * @param userId - The user's unique identifier
   * @returns Promise resolving to user's public profile
   *
   * @example
   * ```typescript
   * const profile = await usersService.getUserProfile('user-id');
   * console.log(profile.isFollowing); // Relationship status with current user
   * ```
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_USER_PROFILE(userId));
  }

  /**
   * Fetch user profile by username (for User Profile feature)
   *
   * @param username - The user's username
   * @returns Promise resolving to user's public profile
   *
   * @example
   * ```typescript
   * const profile = await usersService.fetchUserProfile('johndoe');
   * console.log(profile.displayName);
   * ```
   */
  async fetchUserProfile(username: string): Promise<UserProfile> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<UserProfile>(USERS_ENDPOINTS.GET_USER_PROFILE_BY_USERNAME(username));
  }

  /**
   * Fetch user followers by username
   *
   * @param username - The user's username
   * @returns Promise resolving to paginated list of followers
   *
   * @example
   * ```typescript
   * const followers = await usersService.fetchUserFollowers('johndoe');
   * console.log(followers.items.length); // Number of followers
   * ```
   */
  async fetchUserFollowers(username: string): Promise<PaginatedResponse<UserResponse>> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<PaginatedResponse<UserResponse>>(
      USERS_ENDPOINTS.GET_USER_FOLLOWERS(username),
    );
  }

  /**
   * Fetch users that this user follows by username
   *
   * @param username - The user's username
   * @returns Promise resolving to paginated list of following users
   *
   * @example
   * ```typescript
   * const following = await usersService.fetchUserFollowing('johndoe');
   * console.log(following.items.length); // Number of users being followed
   * ```
   */
  async fetchUserFollowing(username: string): Promise<PaginatedResponse<UserResponse>> {
    if (!username) {
      throw new Error('Username is required');
    }

    return apiClient.get<PaginatedResponse<UserResponse>>(
      USERS_ENDPOINTS.GET_USER_FOLLOWING(username),
    );
  }

  /**
   * Search users by query
   *
   * @param searchQuery - Search term
   * @param options - Additional query options
   * @returns Promise resolving to paginated search results
   *
   * @example
   * ```typescript
   * const results = await usersService.searchUsers('john', { limit: 10 });
   * console.log(`Found ${results.meta.total} users`);
   * ```
   */
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

  /**
   * Get users with pagination support
   *
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Promise resolving to paginated users
   *
   * @example
   * ```typescript
   * const firstPage = await usersService.getUsersPage(1, 20);
   * const secondPage = await usersService.getUsersPage(2, 20);
   * ```
   */
  async getUsersPage(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<UserResponse>> {
    return this.getUsers({ page, limit });
  }

  /**
   * Check if a username is available
   *
   * @param username - Username to check
   * @returns Promise resolving to availability status
   *
   * @example
   * ```typescript
   * const isAvailable = await usersService.isUsernameAvailable('newuser');
   * if (isAvailable) {
   *   console.log('Username is available!');
   * }
   * ```
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }

    try {
      await this.getUserByUsername(username);
      return false; // User exists, username not available
    } catch (error) {
      // If user not found (404), username is available
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return true;
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Batch get users by IDs
   *
   * @param userIds - Array of user IDs to fetch
   * @returns Promise resolving to array of users
   *
   * @example
   * ```typescript
   * const users = await usersService.getBatchUsers(['user1', 'user2', 'user3']);
   * console.log(`Retrieved ${users.length} users`);
   * ```
   */
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

  /**
   * Get user's display name with fallback
   *
   * @param user - User object or ID
   * @returns Display name or username fallback
   *
   * @example
   * ```typescript
   * const displayName = usersService.getDisplayName(user);
   * // Returns displayName if available, otherwise username
   * ```
   */
  getDisplayName(user: UserResponse | string): string {
    if (typeof user === 'string') {
      // If only ID provided, we can't get display name without API call
      return user;
    }

    return user.displayName || user.username || 'Anonymous User';
  }

  /**
   * Get user's avatar URL with fallback
   *
   * @param user - User object
   * @param size - Avatar size in pixels
   * @returns Avatar URL
   *
   * @example
   * ```typescript
   * const avatarUrl = usersService.getAvatarUrl(user, 64);
   * ```
   */
  getAvatarUrl(user: UserResponse, size: number = 40): string {
    return resolveAvatarUrl(user, size);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const usersService = new UsersService();

// ============================================================================
// Individual Function Exports
// ============================================================================

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
