import { atom } from 'nanostores';
import type {
  UserResponse,
  UserProfile,
  PaginatedResponse,
  UpdateProfileRequest,
} from '@glitch/shared-types';
import { getAvatarUrl } from '@/lib/avatar';
import { rewriteReviewAuthors } from './reviews';
import { rewriteFeedAuthors } from './social';

// ── Users State

/** Current user's detailed profile (includes private info like email). */
export const $currentUserProfile = atom<UserProfile | null>(null);

export const $userProfiles = atom<Record<string, UserProfile>>({});

export const $users = atom<Record<string, UserResponse>>({});

export const $usersList = atom<PaginatedResponse<UserResponse> | null>(null);

export const $usersLoading = atom<boolean>(false);

export const $usersError = atom<string | null>(null);

export const $usersQuery = atom<{ search?: string; page: number; limit: number }>({
  page: 1,
  limit: 20,
});

export const $profileUpdateLoading = atom<boolean>(false);

export const $profileUpdateError = atom<string | null>(null);

export const $usernameAvailability = atom<Record<string, boolean>>({});

// ── Viewed User Profile State (User Profile Feature)

export const $viewedProfile = atom<UserProfile | null>(null);

export const $viewedFollowers = atom<PaginatedResponse<UserResponse> | null>(null);

export const $viewedFollowing = atom<PaginatedResponse<UserResponse> | null>(null);

export const $profileLoading = atom<boolean>(false);

export const $profileError = atom<string | null>(null);

// ── Users State Actions

export function setCurrentUserProfile(profile: UserProfile | null): void {
  $currentUserProfile.set(profile);
  $profileUpdateError.set(null);
}

export function setUserProfile(userId: string, profile: UserProfile): void {
  const current = $userProfiles.get();
  $userProfiles.set({
    ...current,
    [userId]: profile,
  });
}

export function setUser(userId: string, user: UserResponse): void {
  const current = $users.get();
  $users.set({
    ...current,
    [userId]: user,
  });
}

export function setUsersList(usersList: PaginatedResponse<UserResponse> | null): void {
  $usersList.set(usersList);
  $usersError.set(null);
}

export function appendUsersList(newUsers: PaginatedResponse<UserResponse>): void {
  const currentList = $usersList.get();

  if (!currentList) {
    setUsersList(newUsers);
    return;
  }

  const updatedList: PaginatedResponse<UserResponse> = {
    ...newUsers,
    items: [...currentList.items, ...newUsers.items],
  };

  setUsersList(updatedList);
}

export function setUsersLoading(loading: boolean): void {
  $usersLoading.set(loading);
  if (loading) {
    $usersError.set(null);
  }
}

export function setUsersError(error: string | null): void {
  $usersError.set(error);
  $usersLoading.set(false);
}

export function setUsersQuery(query: { search?: string; page: number; limit: number }): void {
  $usersQuery.set(query);
}

export function setProfileUpdateLoading(loading: boolean): void {
  $profileUpdateLoading.set(loading);
  if (loading) {
    $profileUpdateError.set(null);
  }
}

export function setProfileUpdateError(error: string | null): void {
  $profileUpdateError.set(error);
  $profileUpdateLoading.set(false);
}

export function setUsernameAvailability(username: string, isAvailable: boolean): void {
  const current = $usernameAvailability.get();
  $usernameAvailability.set({
    ...current,
    [username.toLowerCase()]: isAvailable,
  });
}

export function updateCurrentUserProfile(updates: Partial<UserProfile>): void {
  const currentProfile = $currentUserProfile.get();
  if (currentProfile) {
    const updatedProfile = { ...currentProfile, ...updates };
    setCurrentUserProfile(updatedProfile);
  }
}

export function updateUser(userId: string, updates: Partial<UserResponse>): void {
  const current = $users.get();
  const existingUser = current[userId];

  if (existingUser) {
    const updatedUser = { ...existingUser, ...updates };
    setUser(userId, updatedUser);
  }
}

export function updateUserProfile(userId: string, updates: Partial<UserProfile>): void {
  const current = $userProfiles.get();
  const existingProfile = current[userId];

  if (existingProfile) {
    const updatedProfile = { ...existingProfile, ...updates };
    setUserProfile(userId, updatedProfile);
  }
}

export function removeUser(userId: string): void {
  const currentUsers = $users.get();
  const currentProfiles = $userProfiles.get();

  const { [userId]: removedUser, ...remainingUsers } = currentUsers;
  const { [userId]: removedProfile, ...remainingProfiles } = currentProfiles;

  $users.set(remainingUsers);
  $userProfiles.set(remainingProfiles);
}

export function clearUsersState(): void {
  $currentUserProfile.set(null);
  $userProfiles.set({});
  $users.set({});
  $usersList.set(null);
  $usersLoading.set(false);
  $usersError.set(null);
  $usersQuery.set({ page: 1, limit: 20 });
  $profileUpdateLoading.set(false);
  $profileUpdateError.set(null);
  $usernameAvailability.set({});
}

export function clearUsersListState(): void {
  $usersList.set(null);
  $usersError.set(null);
  $usersQuery.set({ page: 1, limit: 20 });
}

export function clearProfileUpdateState(): void {
  $profileUpdateLoading.set(false);
  $profileUpdateError.set(null);
}

// ── Viewed User Profile Actions (User Profile Feature)

export function setViewedProfile(profile: UserProfile | null): void {
  $viewedProfile.set(profile);
  $profileError.set(null);
}

export function setViewedFollowers(followers: PaginatedResponse<UserResponse> | null): void {
  $viewedFollowers.set(followers);
}

export function setViewedFollowing(following: PaginatedResponse<UserResponse> | null): void {
  $viewedFollowing.set(following);
}

export function setProfileLoading(loading: boolean): void {
  $profileLoading.set(loading);
  if (loading) {
    $profileError.set(null);
  }
}

export function setProfileError(error: string | null): void {
  $profileError.set(error);
  $profileLoading.set(false);
}

export function clearViewedProfileState(): void {
  $viewedProfile.set(null);
  $viewedFollowers.set(null);
  $viewedFollowing.set(null);
  $profileLoading.set(false);
  $profileError.set(null);
}

export function updateViewedProfile(updates: Partial<UserProfile>): void {
  const currentProfile = $viewedProfile.get();
  if (currentProfile) {
    const updatedProfile = { ...currentProfile, ...updates };
    setViewedProfile(updatedProfile);
  }
}

/** Bump the viewed profile's review count after an author posts or deletes one. */
export function adjustViewedProfileReviewsCount(
  authorId: string | null | undefined,
  delta: number,
): void {
  const viewed = $viewedProfile.get();
  if (!authorId || !viewed || viewed.id !== authorId) return;

  setViewedProfile({
    ...viewed,
    stats: { ...viewed.stats, reviewsCount: Math.max(0, viewed.stats.reviewsCount + delta) },
  });
}

// ── Users State Helpers

export function getUser(userId: string): UserResponse | null {
  return $users.get()[userId] || null;
}

export function getUserProfile(userId: string): UserProfile | null {
  return $userProfiles.get()[userId] || null;
}

export function getUsernameAvailability(username: string): boolean | null {
  const availability = $usernameAvailability.get()[username.toLowerCase()];
  return availability !== undefined ? availability : null;
}

export function isUserCached(userId: string): boolean {
  return userId in $users.get();
}

export function isUserProfileCached(userId: string): boolean {
  return userId in $userProfiles.get();
}

export function getAllCachedUsers(): UserResponse[] {
  return Object.values($users.get());
}

export function getAllCachedUserProfiles(): UserProfile[] {
  return Object.values($userProfiles.get());
}

export function getUserDisplayName(userId: string): string {
  const user = getUser(userId);
  const profile = getUserProfile(userId);

  const userData = profile || user;
  if (!userData) return 'Unknown User';

  return userData.displayName || userData.username || 'Anonymous User';
}

export function getUserAvatarUrl(userId: string, size: number = 40): string {
  const user = getUser(userId);
  const profile = getUserProfile(userId);

  return getAvatarUrl(profile || user, size);
}

// ── Service Integration Actions (User Profile Feature)

export async function loadUserProfile(username: string): Promise<void> {
  setProfileLoading(true);

  try {
    const { fetchUserProfile } = await import('../services/users');
    const profile = await fetchUserProfile(username);

    setViewedProfile(profile);
    setProfileLoading(false);
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to load user profile';
    setProfileError(errorMessage);
    console.error('Failed to load user profile:', error);
  }
}

export async function loadUserFollowers(username: string): Promise<void> {
  try {
    const { fetchUserFollowers } = await import('../services/users');
    const followers = await fetchUserFollowers(username);

    setViewedFollowers(followers);
  } catch (error: any) {
    console.error('Failed to load user followers:', error);
    throw error;
  }
}

export async function loadUserFollowing(username: string): Promise<void> {
  try {
    const { fetchUserFollowing } = await import('../services/users');
    const following = await fetchUserFollowing(username);

    setViewedFollowing(following);
  } catch (error: any) {
    console.error('Failed to load user following:', error);
    throw error;
  }
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  setProfileUpdateLoading(true);

  try {
    const { updateProfile: updateProfileService } = await import('../services/users');
    const { updateCurrentUser } = await import('./auth');

    const updatedProfile = await updateProfileService(data);

    setCurrentUserProfile(updatedProfile);

    updateCurrentUser({
      username: updatedProfile.username,
      email: updatedProfile.email,
      avatar: updatedProfile.avatar,
      // Map other relevant fields from UserProfile to AuthUser
    });

    // The same user is cached in several places: viewed profile, user caches, and author copies.
    const author = {
      username: updatedProfile.username,
      displayName: updatedProfile.displayName ?? updatedProfile.username,
      avatar: updatedProfile.avatar,
    };
    updateViewedProfile(updatedProfile);
    updateUserProfile(updatedProfile.id, updatedProfile);
    updateUser(updatedProfile.id, updatedProfile);
    rewriteReviewAuthors(updatedProfile.id, author);
    rewriteFeedAuthors(updatedProfile.id, author);

    setProfileUpdateLoading(false);
    return updatedProfile;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to update profile';
    setProfileUpdateError(errorMessage);
    console.error('Failed to update profile:', error);
    throw error;
  }
}
