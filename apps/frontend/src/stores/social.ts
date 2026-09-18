import { atom } from 'nanostores';
import type {
  SocialStats,
  ActivityFeedResponse,
  ActivityUser,
  FollowSuggestion,
  MutualFollowsResponse,
} from '@glitch/shared-types';

// ── Social Stats State

export const $currentUserSocialStats = atom<SocialStats | null>(null);

export const $userSocialStats = atom<Record<string, SocialStats>>({});

export const $socialStatsLoading = atom<boolean>(false);

export const $socialStatsError = atom<string | null>(null);

// ── Activity Feed State

export const $activityFeed = atom<ActivityFeedResponse | null>(null);

export const $activityFeedLoading = atom<boolean>(false);

export const $activityFeedError = atom<string | null>(null);

export const $activityFeedPage = atom<number>(1);

// ── Follow Suggestions State

export const $followSuggestions = atom<FollowSuggestion[]>([]);

export const $followSuggestionsLoading = atom<boolean>(false);

export const $followSuggestionsError = atom<string | null>(null);

// ── Following State

export const $followingStatus = atom<Record<string, boolean>>({});

export const $mutualFollows = atom<Record<string, MutualFollowsResponse>>({});

export const $followActionsLoading = atom<Record<string, boolean>>({});

// ── Social State Actions

export function setCurrentUserSocialStats(stats: SocialStats | null): void {
  $currentUserSocialStats.set(stats);
  $socialStatsError.set(null);
}

export function setUserSocialStats(userId: string, stats: SocialStats): void {
  const current = $userSocialStats.get();
  $userSocialStats.set({
    ...current,
    [userId]: stats,
  });
}

export function setSocialStatsLoading(loading: boolean): void {
  $socialStatsLoading.set(loading);
  if (loading) {
    $socialStatsError.set(null);
  }
}

export function setSocialStatsError(error: string | null): void {
  $socialStatsError.set(error);
  $socialStatsLoading.set(false);
}

export function setActivityFeed(feed: ActivityFeedResponse | null): void {
  $activityFeed.set(feed);
  $activityFeedError.set(null);
  $activityFeedLoading.set(false);
}

/**
 * Rewrite the author embedded in every cached activity item after a profile edit.
 */
export function rewriteFeedAuthors(
  userId: string,
  author: { username: string; displayName?: string; avatar?: string },
): void {
  const feed = $activityFeed.get();
  if (!feed) return;

  const patch = (user: ActivityUser): ActivityUser =>
    user.id === userId ? { ...user, ...author } : user;

  const items = feed.items.map((item) => ({
    ...item,
    user: patch(item.user),
    followedUser: item.followedUser ? patch(item.followedUser) : item.followedUser,
  }));

  $activityFeed.set({ ...feed, items });
}

export function setActivityFeedLoading(loading: boolean): void {
  $activityFeedLoading.set(loading);
  if (loading) {
    $activityFeedError.set(null);
  }
}

export function setActivityFeedError(error: string | null): void {
  $activityFeedError.set(error);
  $activityFeedLoading.set(false);
}

export function setActivityFeedPage(page: number): void {
  $activityFeedPage.set(page);
}

export function appendActivityFeedItems(newFeed: ActivityFeedResponse): void {
  const currentFeed = $activityFeed.get();

  if (!currentFeed) {
    setActivityFeed(newFeed);
    return;
  }

  const updatedFeed: ActivityFeedResponse = {
    ...newFeed,
    items: [...currentFeed.items, ...newFeed.items],
  };

  setActivityFeed(updatedFeed);
}

export function setFollowSuggestions(suggestions: FollowSuggestion[]): void {
  $followSuggestions.set(suggestions);
  $followSuggestionsError.set(null);
}

export function setFollowSuggestionsLoading(loading: boolean): void {
  $followSuggestionsLoading.set(loading);
  if (loading) {
    $followSuggestionsError.set(null);
  }
}

export function setFollowSuggestionsError(error: string | null): void {
  $followSuggestionsError.set(error);
  $followSuggestionsLoading.set(false);
}

export function setFollowingStatus(userId: string, isFollowing: boolean): void {
  const current = $followingStatus.get();
  $followingStatus.set({
    ...current,
    [userId]: isFollowing,
  });
}

export function setBatchFollowingStatus(statuses: Record<string, boolean>): void {
  const current = $followingStatus.get();
  $followingStatus.set({
    ...current,
    ...statuses,
  });
}

export function setMutualFollows(userId: string, mutualFollows: MutualFollowsResponse): void {
  const current = $mutualFollows.get();
  $mutualFollows.set({
    ...current,
    [userId]: mutualFollows,
  });
}

export function setFollowActionLoading(userId: string, loading: boolean): void {
  const current = $followActionsLoading.get();
  $followActionsLoading.set({
    ...current,
    [userId]: loading,
  });
}

export function updateCurrentUserStatsAfterFollow(isFollowing: boolean): void {
  const currentStats = $currentUserSocialStats.get();
  if (!currentStats) return;

  const updatedStats: SocialStats = {
    ...currentStats,
    followingCount: currentStats.followingCount + (isFollowing ? 1 : -1),
  };

  setCurrentUserSocialStats(updatedStats);
}

export function updateUserStatsAfterBeingFollowed(userId: string, isFollowing: boolean): void {
  const userStats = $userSocialStats.get()[userId];
  if (!userStats) return;

  const updatedStats: SocialStats = {
    ...userStats,
    followersCount: userStats.followersCount + (isFollowing ? 1 : -1),
  };

  setUserSocialStats(userId, updatedStats);
}

export function removeSuggestionAfterFollow(userId: string): void {
  const suggestions = $followSuggestions.get();
  const filteredSuggestions = suggestions.filter((suggestion) => suggestion.id !== userId);
  setFollowSuggestions(filteredSuggestions);
}

// ── Social State Helpers

export function isUserFollowed(userId: string): boolean {
  return $followingStatus.get()[userId] ?? false;
}

export function isFollowActionLoading(userId: string): boolean {
  return $followActionsLoading.get()[userId] ?? false;
}

export function getUserStats(userId: string): SocialStats | null {
  return $userSocialStats.get()[userId] ?? null;
}

export function getUserMutualFollows(userId: string): MutualFollowsResponse | null {
  return $mutualFollows.get()[userId] ?? null;
}

export function clearSocialState(): void {
  $currentUserSocialStats.set(null);
  $userSocialStats.set({});
  $socialStatsLoading.set(false);
  $socialStatsError.set(null);

  $activityFeed.set(null);
  $activityFeedLoading.set(false);
  $activityFeedError.set(null);
  $activityFeedPage.set(1);

  $followSuggestions.set([]);
  $followSuggestionsLoading.set(false);
  $followSuggestionsError.set(null);

  $followingStatus.set({});
  $mutualFollows.set({});
  $followActionsLoading.set({});
}

export function clearActivityFeedState(): void {
  $activityFeed.set(null);
  $activityFeedLoading.set(false);
  $activityFeedError.set(null);
  $activityFeedPage.set(1);
}

export function clearFollowSuggestionsState(): void {
  $followSuggestions.set([]);
  $followSuggestionsLoading.set(false);
  $followSuggestionsError.set(null);
}

export function clearSocialStatsState(): void {
  $currentUserSocialStats.set(null);
  $userSocialStats.set({});
  $socialStatsLoading.set(false);
  $socialStatsError.set(null);
}

// ── Service Integration Actions (User Profile Feature)

/** Follow a user with an optimistic update; rolls back on failure. */
export async function followUser(userId: string): Promise<void> {
  setFollowActionLoading(userId, true);
  setFollowingStatus(userId, true);

  const { $viewedProfile, updateViewedProfile } = await import('./users');
  const viewedProfile = $viewedProfile.get();

  if (viewedProfile && viewedProfile.id === userId) {
    updateViewedProfile({
      isFollowing: true,
      stats: {
        ...viewedProfile.stats,
        followersCount: viewedProfile.stats.followersCount + 1,
      },
    });
  }

  updateCurrentUserStatsAfterFollow(true);

  try {
    const { followUser: followUserService } = await import('../services/social');
    await followUserService(userId);

    setFollowActionLoading(userId, false);
  } catch (error: any) {
    // Rollback optimistic updates on error
    setFollowingStatus(userId, false);

    if (viewedProfile && viewedProfile.id === userId) {
      updateViewedProfile({
        isFollowing: false,
        stats: {
          ...viewedProfile.stats,
          followersCount: Math.max(0, viewedProfile.stats.followersCount - 1),
        },
      });
    }

    updateCurrentUserStatsAfterFollow(false);

    setFollowActionLoading(userId, false);
    console.error('Failed to follow user:', error);
    throw error;
  }
}

/** Unfollow a user with an optimistic update; rolls back on failure. */
export async function unfollowUser(userId: string): Promise<void> {
  setFollowActionLoading(userId, true);
  setFollowingStatus(userId, false);

  const { $viewedProfile, updateViewedProfile } = await import('./users');
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

  updateCurrentUserStatsAfterFollow(false);

  try {
    const { unfollowUser: unfollowUserService } = await import('../services/social');
    await unfollowUserService(userId);

    setFollowActionLoading(userId, false);
  } catch (error: any) {
    // Rollback optimistic updates on error
    setFollowingStatus(userId, true);

    if (viewedProfile && viewedProfile.id === userId) {
      updateViewedProfile({
        isFollowing: true,
        stats: {
          ...viewedProfile.stats,
          followersCount: viewedProfile.stats.followersCount + 1,
        },
      });
    }

    updateCurrentUserStatsAfterFollow(true);

    setFollowActionLoading(userId, false);
    console.error('Failed to unfollow user:', error);
    throw error;
  }
}
