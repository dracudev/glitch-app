import { atom, computed } from 'nanostores';
import type { AuthUser, UserRole } from '@glitch/shared-types';
import { getAvatarUrl } from '@/lib/avatar';
import { clearAllReviewsState } from './reviews';
import { clearAllGamesState } from './games';
import { clearSocialState } from './social';
import { clearUsersState, clearViewedProfileState } from './users';

// ── Core Authentication State

export const $currentUser = atom<AuthUser | null>(null);

export const $isAuthenticated = computed($currentUser, (user) => user !== null);

export const $userRole = computed(
  $currentUser,
  (user): UserRole | null => (user?.role as UserRole) || null,
);

export const $authToken = atom<string | null>(null);

export const $refreshToken = atom<string | null>(null);

export const $authLoading = atom<boolean>(false);

export const $authError = atom<string | null>(null);

// ── Computed State Selectors

export const $isAdmin = computed($userRole, (role) => role === 'ADMIN');

export const $isModerator = computed($userRole, (role) => role === 'MODERATOR' || role === 'ADMIN');

export const $isProfileComplete = computed($currentUser, (user) => {
  if (!user) return false;
  return !!(user.username && user.email);
});

export const $displayName = computed($currentUser, (user) => user?.username || 'Anonymous');

// ── State Actions

export function setAuthenticatedUser(user: AuthUser, accessToken: string, refreshToken: string) {
  $currentUser.set(user);
  $authToken.set(accessToken);
  $refreshToken.set(refreshToken);
  $authError.set(null);

  persistAuthState(user, accessToken, refreshToken);
}

export function updateCurrentUser(updates: Partial<AuthUser>) {
  const currentUser = $currentUser.get();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...updates };
    $currentUser.set(updatedUser);

    const token = $authToken.get();
    const refreshToken = $refreshToken.get();
    if (token && refreshToken) {
      persistAuthState(updatedUser, token, refreshToken);
    }
  }
}

export function updateAuthTokens(accessToken: string, refreshToken: string) {
  $authToken.set(accessToken);
  $refreshToken.set(refreshToken);

  const currentUser = $currentUser.get();
  if (currentUser) {
    persistAuthState(currentUser, accessToken, refreshToken);
  }
}

export function clearAuthState() {
  $currentUser.set(null);
  $authToken.set(null);
  $refreshToken.set(null);
  $authError.set(null);
  $authLoading.set(false);

  clearPersistedAuthState();

  // The session is gone: drop every user-scoped cache or the next visitor sees the previous user's data.
  clearAllReviewsState();
  clearAllGamesState();
  clearSocialState();
  clearUsersState();
  clearViewedProfileState();
}

export function setAuthLoading(loading: boolean) {
  $authLoading.set(loading);
}

export function setAuthError(error: string | null) {
  $authError.set(error);
}

// ── Persistence Layer

const AUTH_STORAGE_KEY = 'glitch_auth';

interface PersistedAuthState {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}

function persistAuthState(user: AuthUser, accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    const authState: PersistedAuthState = {
      user,
      accessToken,
      refreshToken,
      timestamp: Date.now(),
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  } catch (error) {
    console.warn('Failed to persist auth state:', error);
  }
}

export function loadPersistedAuthState(): PersistedAuthState | null {
  if (typeof window === 'undefined') return null; // SSR safety

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const authState: PersistedAuthState = JSON.parse(stored);

    const tokenAge = Date.now() - authState.timestamp;
    const MAX_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    if (tokenAge > MAX_TOKEN_AGE) {
      clearPersistedAuthState();
      return null;
    }

    return authState;
  } catch (error) {
    console.warn('Failed to load persisted auth state:', error);
    clearPersistedAuthState();
    return null;
  }
}

function clearPersistedAuthState() {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear persisted auth state:', error);
  }
}

export function initializeAuthState() {
  const persistedState = loadPersistedAuthState();

  if (persistedState) {
    $currentUser.set(persistedState.user);
    $authToken.set(persistedState.accessToken);
    $refreshToken.set(persistedState.refreshToken);
  }
}

// ── Helper Functions

export function hasRole(role: UserRole): boolean {
  const currentRole = $userRole.get();
  if (!currentRole) return false;

  // Admin has all permissions
  if (currentRole === 'ADMIN') return true;

  // Moderator has moderator and user permissions
  if (currentRole === 'MODERATOR' && (role === 'MODERATOR' || role === 'USER')) {
    return true;
  }

  return currentRole === role;
}

export function canAccessAdmin(): boolean {
  return hasRole('ADMIN');
}

export function canModerate(): boolean {
  return hasRole('MODERATOR') || hasRole('ADMIN');
}

export function getUserAvatarUrl(size: number = 40): string {
  return getAvatarUrl($currentUser.get(), size);
}
