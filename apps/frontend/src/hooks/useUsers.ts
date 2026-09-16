import { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type {
  UserResponse,
  UserProfile,
  UpdateProfileRequest,
  UsersQuery,
  PaginatedResponse,
} from '@glitch/shared-types';

import { usersService } from '@/services/users';
import {
  $currentUserProfile,
  $usersList,
  $usersLoading,
  $usersError,
  $usersQuery,
  $profileUpdateLoading,
  $profileUpdateError,
  $usernameAvailability,
  setCurrentUserProfile,
  setUserProfile,
  setUser,
  setUsersList,
  appendUsersList,
  setUsersLoading,
  setUsersError,
  setUsersQuery,
  setProfileUpdateLoading,
  setProfileUpdateError,
  setUsernameAvailability,
  clearUsersState,
  clearUsersListState,
  getUser,
  getUserProfile,
  getUsernameAvailability,
  isUserCached,
  isUserProfileCached,
  updateViewedProfile,
} from '@/stores/users';
import { updateCurrentUser } from '@/stores/auth';

// ============================================================================
// Types
// ============================================================================

interface UseUsersReturn {
  // State
  users: PaginatedResponse<UserResponse> | null;
  isLoading: boolean;
  error: string | null;
  query: { search?: string; page: number; limit: number };

  // Actions
  fetchUsers: (query?: UsersQuery) => Promise<PaginatedResponse<UserResponse>>;
  searchUsers: (
    searchQuery: string,
    options?: Omit<UsersQuery, 'search'>,
  ) => Promise<PaginatedResponse<UserResponse>>;
  loadMoreUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  clearUsers: () => void;
}

interface UseUserReturn {
  // State
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUser: (userId: string) => Promise<UserResponse>;
  fetchUserByUsername: (username: string) => Promise<UserResponse>;
  refreshUser: (userId: string) => Promise<void>;
}

interface UseUserProfileReturn {
  // State
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: (userId: string) => Promise<UserProfile>;
  refreshProfile: (userId: string) => Promise<void>;
}

interface UseCurrentUserProfileReturn {
  // State
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateLoading: boolean;
  updateError: string | null;

  // Actions
  fetchCurrentProfile: () => Promise<UserProfile>;
  updateProfile: (updates: UpdateProfileRequest) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  clearUpdateError: () => void;
}

interface UseUsernameAvailabilityReturn {
  // State
  availability: Record<string, boolean>;

  // Actions
  checkAvailability: (username: string) => Promise<boolean>;
  getCachedAvailability: (username: string) => boolean | null;
}

// ============================================================================
// Users List Hook
// ============================================================================

/**
 * Hook for managing users list with pagination and search
 *
 * @example
 * ```typescript
 * const { users, fetchUsers, searchUsers, loadMoreUsers } = useUsers();
 *
 * // Fetch initial users
 * useEffect(() => {
 *   fetchUsers();
 * }, []);
 * ```
 */
export function useUsers(): UseUsersReturn {
  const users = useStore($usersList);
  const isLoading = useStore($usersLoading);
  const error = useStore($usersError);
  const query = useStore($usersQuery);

  const fetchUsers = useCallback(
    async (queryParams: UsersQuery = {}): Promise<PaginatedResponse<UserResponse>> => {
      try {
        setUsersLoading(true);
        const result = await usersService.getUsers(queryParams);
        setUsersList(result);
        setUsersQuery({
          search: queryParams.search,
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        });

        // Cache individual users
        result.items.forEach((user) => {
          setUser(user.id, user);
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        setUsersError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const searchUsers = useCallback(
    async (
      searchQuery: string,
      options: Omit<UsersQuery, 'search'> = {},
    ): Promise<PaginatedResponse<UserResponse>> => {
      try {
        setUsersLoading(true);
        const result = await usersService.searchUsers(searchQuery, options);
        setUsersList(result);
        setUsersQuery({
          search: searchQuery,
          page: options.page || 1,
          limit: options.limit || 20,
        });

        // Cache individual users
        result.items.forEach((user) => {
          setUser(user.id, user);
        });

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search users';
        setUsersError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const loadMoreUsers = useCallback(async (): Promise<void> => {
    const currentUsers = users;
    if (
      !currentUsers ||
      !currentUsers.meta.totalPages ||
      currentUsers.meta.page >= currentUsers.meta.totalPages ||
      isLoading
    ) {
      return;
    }

    try {
      setUsersLoading(true);
      const nextPage = currentUsers.meta.page + 1;
      const moreUsers = await usersService.getUsers({
        ...query,
        page: nextPage,
      });

      appendUsersList(moreUsers);
      setUsersQuery({ ...query, page: nextPage });

      // Cache individual users
      moreUsers.items.forEach((user) => {
        setUser(user.id, user);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more users';
      setUsersError(errorMessage);
    }
  }, [users, query, isLoading]);

  const refreshUsers = useCallback(async (): Promise<void> => {
    await fetchUsers({ ...query, page: 1 });
  }, [fetchUsers, query]);

  const clearUsers = useCallback((): void => {
    clearUsersListState();
  }, []);

  return {
    users,
    isLoading,
    error,
    query,
    fetchUsers,
    searchUsers,
    loadMoreUsers,
    refreshUsers,
    clearUsers,
  };
}

// ============================================================================
// Individual User Hook
// ============================================================================

/**
 * Hook for managing individual user data
 *
 * @example
 * ```typescript
 * const { user, fetchUser } = useUser();
 *
 * // Fetch user by ID
 * const handleFetchUser = async () => {
 *   await fetchUser('user-id');
 * };
 * ```
 */
export function useUser(): UseUserReturn {
  const isLoading = useStore($usersLoading);
  const error = useStore($usersError);

  // Note: This hook manages a single user, but uses the same loading/error state
  // In a more complex app, you might want separate loading states per user
  const user = null; // This would need to be managed differently for individual users

  const fetchUser = useCallback(async (userId: string): Promise<UserResponse> => {
    if (isUserCached(userId)) {
      return getUser(userId)!;
    }

    try {
      setUsersLoading(true);
      const userData = await usersService.getUserById(userId);
      setUser(userId, userData);
      setUsersLoading(false);
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setUsersError(errorMessage);
      throw err;
    }
  }, []);

  const fetchUserByUsername = useCallback(async (username: string): Promise<UserResponse> => {
    try {
      setUsersLoading(true);
      const userData = await usersService.getUserByUsername(username);
      setUser(userData.id, userData);
      setUsersLoading(false);
      return userData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setUsersError(errorMessage);
      throw err;
    }
  }, []);

  const refreshUser = useCallback(
    async (userId: string): Promise<void> => {
      await fetchUser(userId);
    },
    [fetchUser],
  );

  return {
    user,
    isLoading,
    error,
    fetchUser,
    fetchUserByUsername,
    refreshUser,
  };
}

// ============================================================================
// User Profile Hook
// ============================================================================

/**
 * Hook for managing user profiles
 *
 * @example
 * ```typescript
 * const { profile, fetchProfile } = useUserProfile();
 *
 * // Fetch user profile
 * const handleFetchProfile = async () => {
 *   await fetchProfile('user-id');
 * };
 * ```
 */
export function useUserProfile(): UseUserProfileReturn {
  const isLoading = useStore($usersLoading);
  const error = useStore($usersError);

  // Note: Similar to useUser, this manages profiles but uses shared loading state
  const profile = null;

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile> => {
    if (isUserProfileCached(userId)) {
      return getUserProfile(userId)!;
    }

    try {
      setUsersLoading(true);
      const profileData = await usersService.getUserProfile(userId);
      setUserProfile(userId, profileData);
      setUsersLoading(false);
      return profileData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user profile';
      setUsersError(errorMessage);
      throw err;
    }
  }, []);

  const refreshProfile = useCallback(
    async (userId: string): Promise<void> => {
      await fetchProfile(userId);
    },
    [fetchProfile],
  );

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    refreshProfile,
  };
}

// ============================================================================
// Current User Profile Hook
// ============================================================================

/**
 * Hook for managing current user's profile
 *
 * @example
 * ```typescript
 * const { profile, updateProfile, fetchCurrentProfile } = useCurrentUserProfile();
 *
 * // Update profile
 * const handleUpdateProfile = async () => {
 *   await updateProfile({ displayName: 'New Name' });
 * };
 * ```
 */
export function useCurrentUserProfile(): UseCurrentUserProfileReturn {
  const profile = useStore($currentUserProfile);
  const isLoading = useStore($usersLoading);
  const error = useStore($usersError);
  const updateLoading = useStore($profileUpdateLoading);
  const updateError = useStore($profileUpdateError);

  const fetchCurrentProfile = useCallback(async (): Promise<UserProfile> => {
    try {
      setUsersLoading(true);
      const profileData = await usersService.getCurrentUserProfile();
      setCurrentUserProfile(profileData);
      return profileData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch current user profile';
      setUsersError(errorMessage);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (updates: UpdateProfileRequest): Promise<UserProfile> => {
    try {
      setProfileUpdateLoading(true);
      const updatedProfile = await usersService.updateProfile(updates);
      setCurrentUserProfile(updatedProfile);
      // The profile page header reads $viewedProfile / $currentUser, so keep them in sync
      // instead of leaving the page stale until a reload.
      updateViewedProfile(updatedProfile);
      updateCurrentUser({ avatar: updatedProfile.avatar, bio: updatedProfile.bio });
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileUpdateError(errorMessage);
      throw err;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    await fetchCurrentProfile();
  }, [fetchCurrentProfile]);

  const clearUpdateError = useCallback((): void => {
    setProfileUpdateError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateLoading,
    updateError,
    fetchCurrentProfile,
    updateProfile,
    refreshProfile,
    clearUpdateError,
  };
}

// ============================================================================
// Username Availability Hook
// ============================================================================

/**
 * Hook for checking username availability
 *
 * @example
 * ```typescript
 * const { checkAvailability, getCachedAvailability } = useUsernameAvailability();
 *
 * // Check if username is available
 * const handleCheckUsername = async () => {
 *   const isAvailable = await checkAvailability('newusername');
 *   console.log(isAvailable ? 'Available' : 'Taken');
 * };
 * ```
 */
export function useUsernameAvailability(): UseUsernameAvailabilityReturn {
  const availability = useStore($usernameAvailability);

  const checkAvailability = useCallback(async (username: string): Promise<boolean> => {
    const cached = getUsernameAvailability(username);
    if (cached !== null) {
      return cached;
    }

    try {
      const isAvailable = await usersService.isUsernameAvailable(username);
      setUsernameAvailability(username, isAvailable);
      return isAvailable;
    } catch (err) {
      // On error, don't cache the result
      throw err;
    }
  }, []);

  const getCachedAvailability = useCallback((username: string): boolean | null => {
    return getUsernameAvailability(username);
  }, []);

  return {
    availability,
    checkAvailability,
    getCachedAvailability,
  };
}

// ============================================================================
// Combined Users Hook
// ============================================================================

/**
 * Combined hook that provides access to all users functionality
 *
 * @example
 * ```typescript
 * const users = useUsersModule();
 *
 * // Access all users features
 * const { list, user, profile, currentProfile, usernameCheck } = users;
 * ```
 */
export function useUsersModule() {
  const list = useUsers();
  const user = useUser();
  const profile = useUserProfile();
  const currentProfile = useCurrentUserProfile();
  const usernameCheck = useUsernameAvailability();

  // Clear all users state
  const clearAll = useCallback((): void => {
    clearUsersState();
  }, []);

  // Auto-fetch current user profile on mount (optional)
  useEffect(() => {
    currentProfile.fetchCurrentProfile().catch(console.error);
  }, []);

  return {
    list,
    user,
    profile,
    currentProfile,
    usernameCheck,
    clearAll,
  };
}
