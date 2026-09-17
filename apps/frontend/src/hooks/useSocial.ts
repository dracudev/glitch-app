import { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type {
  SocialStats,
  ActivityFeedResponse,
  ActivityFeedQuery,
  FollowSuggestion,
  FollowSuggestionsQuery,
  MutualFollowsResponse,
  ActivityType,
} from '@glitch/shared-types';

import { socialService } from '@/services/social';
import { $currentUser } from '@/stores/auth';
import {
  $currentUserSocialStats,
  $socialStatsLoading,
  $socialStatsError,
  $activityFeed,
  $activityFeedLoading,
  $activityFeedError,
  $activityFeedPage,
  $followSuggestions,
  $followSuggestionsLoading,
  $followSuggestionsError,
  $followingStatus,
  $followActionsLoading,
  setCurrentUserSocialStats,
  setUserSocialStats,
  setSocialStatsLoading,
  setSocialStatsError,
  setActivityFeed,
  setActivityFeedLoading,
  setActivityFeedError,
  setActivityFeedPage,
  appendActivityFeedItems,
  setFollowSuggestions,
  setFollowSuggestionsLoading,
  setFollowSuggestionsError,
  setFollowingStatus,
  setBatchFollowingStatus,
  setMutualFollows,
  setFollowActionLoading,
  updateCurrentUserStatsAfterFollow,
  updateUserStatsAfterBeingFollowed,
  removeSuggestionAfterFollow,
  clearSocialState,
  clearActivityFeedState,
  clearFollowSuggestionsState,
  isUserFollowed,
  getUserMutualFollows,
} from '@/stores/social';

// ============================================================================
// Types
// ============================================================================

interface UseSocialStatsReturn {
  // State
  currentUserStats: SocialStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCurrentUserStats: () => Promise<SocialStats>;
  fetchUserStats: (userId: string) => Promise<SocialStats>;
  refreshStats: () => Promise<void>;
  clearStats: () => void;
}

interface UseActivityFeedReturn {
  // State
  feed: ActivityFeedResponse | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;

  // Actions
  fetchFeed: (query?: ActivityFeedQuery) => Promise<ActivityFeedResponse>;
  fetchFeedByType: (
    type: ActivityType,
    options?: Omit<ActivityFeedQuery, 'type'>,
  ) => Promise<ActivityFeedResponse>;
  fetchRecentActivity: (
    options?: Omit<ActivityFeedQuery, 'since' | 'until'>,
  ) => Promise<ActivityFeedResponse>;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  clearFeed: () => void;
}

interface UseFollowSuggestionsReturn {
  // State
  suggestions: FollowSuggestion[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSuggestions: (query?: FollowSuggestionsQuery) => Promise<FollowSuggestion[]>;
  refreshSuggestions: () => Promise<void>;
  clearSuggestions: () => void;
}

interface UseFollowActionsReturn {
  // State
  followingStatus: Record<string, boolean>;
  loadingActions: Record<string, boolean>;

  // Actions
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  checkFollowingStatus: (userId: string) => Promise<boolean>;
  batchCheckFollowing: (userIds: string[]) => Promise<Record<string, boolean>>;
  followMultiple: (userIds: string[]) => Promise<void>;
  unfollowMultiple: (userIds: string[]) => Promise<void>;
}

interface UseMutualFollowsReturn {
  // Actions
  fetchMutualFollows: (userId: string) => Promise<MutualFollowsResponse>;
  getMutualFollows: (userId: string) => MutualFollowsResponse | null;
}

// ============================================================================
// Social Stats Hook
// ============================================================================

/**
 * Hook for managing social statistics
 *
 * @example
 * ```typescript
 * const { currentUserStats, fetchCurrentUserStats, fetchUserStats } = useSocialStats();
 *
 * // Fetch current user's stats
 * useEffect(() => {
 *   fetchCurrentUserStats();
 * }, []);
 * ```
 */
export function useSocialStats(): UseSocialStatsReturn {
  const currentUserStats = useStore($currentUserSocialStats);
  const isLoading = useStore($socialStatsLoading);
  const error = useStore($socialStatsError);

  const fetchCurrentUserStats = useCallback(async (): Promise<SocialStats> => {
    try {
      setSocialStatsLoading(true);
      const stats = await socialService.getCurrentUserSocialStats();
      setCurrentUserSocialStats(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch social stats';
      setSocialStatsError(errorMessage);
      throw err;
    }
  }, []);

  const fetchUserStats = useCallback(async (userId: string): Promise<SocialStats> => {
    try {
      setSocialStatsLoading(true);
      const stats = await socialService.getUserSocialStats(userId);
      setUserSocialStats(userId, stats);
      setSocialStatsLoading(false);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user stats';
      setSocialStatsError(errorMessage);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async (): Promise<void> => {
    await fetchCurrentUserStats();
  }, [fetchCurrentUserStats]);

  const clearStats = useCallback((): void => {
    setCurrentUserSocialStats(null);
    setSocialStatsError(null);
  }, []);

  return {
    currentUserStats,
    isLoading,
    error,
    fetchCurrentUserStats,
    fetchUserStats,
    refreshStats,
    clearStats,
  };
}

// ============================================================================
// Activity Feed Hook
// ============================================================================

/**
 * Hook for managing activity feeds
 *
 * @example
 * ```typescript
 * const { feed, fetchFeed, loadMoreFeed } = useActivityFeed();
 *
 * // Fetch initial feed
 * useEffect(() => {
 *   fetchFeed();
 * }, []);
 * ```
 */
export function useActivityFeed(): UseActivityFeedReturn {
  const feed = useStore($activityFeed);
  const isLoading = useStore($activityFeedLoading);
  const error = useStore($activityFeedError);
  const currentPage = useStore($activityFeedPage);

  const fetchFeed = useCallback(
    async (query: ActivityFeedQuery = {}): Promise<ActivityFeedResponse> => {
      try {
        setActivityFeedLoading(true);
        const feedData = await socialService.getActivityFeed(query);
        setActivityFeed(feedData);
        setActivityFeedPage(query.page || 1);
        return feedData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity feed';
        setActivityFeedError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const fetchFeedByType = useCallback(
    async (
      type: ActivityType,
      options: Omit<ActivityFeedQuery, 'type'> = {},
    ): Promise<ActivityFeedResponse> => {
      try {
        setActivityFeedLoading(true);
        const feedData = await socialService.getActivityFeedByType(type, options);
        setActivityFeed(feedData);
        setActivityFeedPage(options.page || 1);
        return feedData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch activity feed by type';
        setActivityFeedError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const fetchRecentActivity = useCallback(
    async (
      options: Omit<ActivityFeedQuery, 'since' | 'until'> = {},
    ): Promise<ActivityFeedResponse> => {
      try {
        setActivityFeedLoading(true);
        const feedData = await socialService.getRecentActivity(options);
        setActivityFeed(feedData);
        setActivityFeedPage(options.page || 1);
        return feedData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent activity';
        setActivityFeedError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const loadMoreFeed = useCallback(async (): Promise<void> => {
    const currentFeed = feed;
    if (!currentFeed || !currentFeed.meta.hasNext || isLoading) {
      return;
    }

    try {
      setActivityFeedLoading(true);
      const nextPage = currentPage + 1;
      const moreFeed = await socialService.getActivityFeed({
        page: nextPage,
        limit: currentFeed.meta.limit,
      });
      appendActivityFeedItems(moreFeed);
      setActivityFeedPage(nextPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more feed items';
      setActivityFeedError(errorMessage);
    }
  }, [feed, currentPage, isLoading]);

  const refreshFeed = useCallback(async (): Promise<void> => {
    await fetchFeed({ page: 1 });
  }, [fetchFeed]);

  const clearFeed = useCallback((): void => {
    clearActivityFeedState();
  }, []);

  return {
    feed,
    isLoading,
    error,
    currentPage,
    fetchFeed,
    fetchFeedByType,
    fetchRecentActivity,
    loadMoreFeed,
    refreshFeed,
    clearFeed,
  };
}

// ============================================================================
// Follow Suggestions Hook
// ============================================================================

/**
 * Hook for managing follow suggestions
 *
 * @example
 * ```typescript
 * const { suggestions, fetchSuggestions } = useFollowSuggestions();
 *
 * // Fetch suggestions
 * useEffect(() => {
 *   fetchSuggestions();
 * }, []);
 * ```
 */
export function useFollowSuggestions(): UseFollowSuggestionsReturn {
  const suggestions = useStore($followSuggestions);
  const isLoading = useStore($followSuggestionsLoading);
  const error = useStore($followSuggestionsError);

  const fetchSuggestions = useCallback(
    async (query: FollowSuggestionsQuery = {}): Promise<FollowSuggestion[]> => {
      try {
        setFollowSuggestionsLoading(true);
        const suggestionsData = await socialService.getFollowSuggestions(query);
        setFollowSuggestions(suggestionsData);
        return suggestionsData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch follow suggestions';
        setFollowSuggestionsError(errorMessage);
        throw err;
      }
    },
    [],
  );

  const refreshSuggestions = useCallback(async (): Promise<void> => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  const clearSuggestions = useCallback((): void => {
    clearFollowSuggestionsState();
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    refreshSuggestions,
    clearSuggestions,
  };
}

// ============================================================================
// Follow Actions Hook
// ============================================================================

/**
 * Hook for managing follow/unfollow actions
 *
 * @example
 * ```typescript
 * const { followUser, unfollowUser, followingStatus } = useFollowActions();
 *
 * // Follow a user
 * const handleFollow = async () => {
 *   await followUser('user-id');
 * };
 * ```
 */
export function useFollowActions(): UseFollowActionsReturn {
  const followingStatus = useStore($followingStatus);
  const loadingActions = useStore($followActionsLoading);

  const followUser = useCallback(async (userId: string): Promise<void> => {
    // Optimistic: update viewed profile counts immediately
    const { $viewedProfile, updateViewedProfile } = await import('@/stores/users');
    const viewedProfile = $viewedProfile.get();

    if (viewedProfile && viewedProfile.id === userId) {
      updateViewedProfile({
        isFollowing: true,
        stats: { ...viewedProfile.stats, followersCount: viewedProfile.stats.followersCount + 1 },
      });
    }

    try {
      setFollowActionLoading(userId, true);
      await socialService.followUser(userId);
      setFollowingStatus(userId, true);
      updateCurrentUserStatsAfterFollow(true);
      updateUserStatsAfterBeingFollowed(userId, true);
      removeSuggestionAfterFollow(userId);
      // A follow is a feed event - drop the cached feed so /feed refetches.
      clearActivityFeedState();

      // Refetch follow lists to show the new follower card
      if (viewedProfile) {
        const { loadUserFollowers, loadUserFollowing } = await import('@/stores/users');
        loadUserFollowers(viewedProfile.username);
        if (viewedProfile.id === $currentUser.get()?.id) {
          loadUserFollowing(viewedProfile.username);
        }
      }
    } catch (err) {
      // Rollback counts
      if (viewedProfile && viewedProfile.id === userId) {
        updateViewedProfile({
          isFollowing: false,
          stats: {
            ...viewedProfile.stats,
            followersCount: Math.max(0, viewedProfile.stats.followersCount - 1),
          },
        });
      }
      throw err;
    } finally {
      setFollowActionLoading(userId, false);
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string): Promise<void> => {
    // Optimistic: update viewed profile counts immediately
    const { $viewedProfile, updateViewedProfile } = await import('@/stores/users');
    const viewedProfile = $viewedProfile.get();

    if (viewedProfile && viewedProfile.id === userId) {
      updateViewedProfile({
        isFollowing: false,
        stats: {
          ...viewedProfile.stats,
          followersCount: Math.max(0, viewedProfile.stats.followersCount - 1),
        },
      });
    }

    try {
      setFollowActionLoading(userId, true);
      await socialService.unfollowUser(userId);
      setFollowingStatus(userId, false);
      updateCurrentUserStatsAfterFollow(false);
      updateUserStatsAfterBeingFollowed(userId, false);
      clearActivityFeedState();

      // Refetch follow lists to remove the follower card
      if (viewedProfile) {
        const { loadUserFollowers, loadUserFollowing } = await import('@/stores/users');
        loadUserFollowers(viewedProfile.username);
        if (viewedProfile.id === $currentUser.get()?.id) {
          loadUserFollowing(viewedProfile.username);
        }
      }
    } catch (err) {
      // Rollback counts
      if (viewedProfile && viewedProfile.id === userId) {
        updateViewedProfile({
          isFollowing: true,
          stats: { ...viewedProfile.stats, followersCount: viewedProfile.stats.followersCount + 1 },
        });
      }
      throw err;
    } finally {
      setFollowActionLoading(userId, false);
    }
  }, []);

  const toggleFollow = useCallback(
    async (userId: string): Promise<void> => {
      const isCurrentlyFollowing = isUserFollowed(userId);

      if (isCurrentlyFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    },
    [followUser, unfollowUser],
  );

  const checkFollowingStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const result = await socialService.isFollowing(userId);
      setFollowingStatus(userId, result.isFollowing);
      return result.isFollowing;
    } catch (err) {
      throw err;
    }
  }, []);

  const batchCheckFollowing = useCallback(
    async (userIds: string[]): Promise<Record<string, boolean>> => {
      try {
        const statuses = await socialService.batchCheckFollowing(userIds);
        setBatchFollowingStatus(statuses);
        return statuses;
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  const followMultiple = useCallback(async (userIds: string[]): Promise<void> => {
    try {
      await socialService.followMultipleUsers(userIds);

      // Update following status for all users
      const newStatuses: Record<string, boolean> = {};
      userIds.forEach((userId) => {
        newStatuses[userId] = true;
      });
      setBatchFollowingStatus(newStatuses);

      // Update current user's following count
      updateCurrentUserStatsAfterFollow(true);
    } catch (err) {
      throw err;
    }
  }, []);

  const unfollowMultiple = useCallback(async (userIds: string[]): Promise<void> => {
    try {
      await socialService.unfollowMultipleUsers(userIds);

      // Update following status for all users
      const newStatuses: Record<string, boolean> = {};
      userIds.forEach((userId) => {
        newStatuses[userId] = false;
      });
      setBatchFollowingStatus(newStatuses);

      // Update current user's following count
      updateCurrentUserStatsAfterFollow(false);
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    followingStatus,
    loadingActions,
    followUser,
    unfollowUser,
    toggleFollow,
    checkFollowingStatus,
    batchCheckFollowing,
    followMultiple,
    unfollowMultiple,
  };
}

// ============================================================================
// Mutual Follows Hook
// ============================================================================

/**
 * Hook for managing mutual follows
 *
 * @example
 * ```typescript
 * const { fetchMutualFollows, getMutualFollows } = useMutualFollows();
 *
 * // Fetch mutual follows
 * const mutuals = await fetchMutualFollows('user-id');
 * ```
 */
export function useMutualFollows(): UseMutualFollowsReturn {
  const fetchMutualFollows = useCallback(async (userId: string): Promise<MutualFollowsResponse> => {
    try {
      const mutualFollows = await socialService.getMutualFollows(userId);
      setMutualFollows(userId, mutualFollows);
      return mutualFollows;
    } catch (err) {
      throw err;
    }
  }, []);

  const getMutualFollows = useCallback((userId: string): MutualFollowsResponse | null => {
    return getUserMutualFollows(userId);
  }, []);

  return {
    fetchMutualFollows,
    getMutualFollows,
  };
}

// ============================================================================
// Combined Social Hook
// ============================================================================

/**
 * Combined hook that provides access to all social functionality
 *
 * @example
 * ```typescript
 * const social = useSocial();
 *
 * // Access all social features
 * const { stats, feed, suggestions, actions } = social;
 * ```
 */
export function useSocial() {
  const stats = useSocialStats();
  const feed = useActivityFeed();
  const suggestions = useFollowSuggestions();
  const actions = useFollowActions();
  const mutuals = useMutualFollows();

  // Clear all social state
  const clearAll = useCallback((): void => {
    clearSocialState();
  }, []);

  // Auto-fetch current user stats on mount
  useEffect(() => {
    stats.fetchCurrentUserStats().catch(console.error);
  }, []);

  return {
    stats,
    feed,
    suggestions,
    actions,
    mutuals,
    clearAll,
  };
}
