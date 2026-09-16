import { atom, computed } from 'nanostores';
import type { AuthUser, UserRole } from '@glitch/shared-types';
import { getAvatarUrl } from '@/lib/avatar';

// ============================================================================
// Core Authentication State
// ============================================================================

/**
 * Current authenticated user information
 */
export const $currentUser = atom<AuthUser | null>(null);

/**
 * Authentication status - computed from currentUser state
 */
export const $isAuthenticated = computed($currentUser, (user) => user !== null);

/**
 * Current user's role - computed from currentUser state
 */
export const $userRole = computed(
  $currentUser,
  (user): UserRole | null => (user?.role as UserRole) || null,
);

/**
 * JWT access token for API authentication
 */
export const $authToken = atom<string | null>(null);

/**
 * JWT refresh token for token renewal
 */
export const $refreshToken = atom<string | null>(null);

/**
 * Authentication loading state (for login/logout operations)
 */
export const $authLoading = atom<boolean>(false);

/**
 * Authentication error state
 */
export const $authError = atom<string | null>(null);

// ============================================================================
// Computed State Selectors
// ============================================================================

/**
 * Check if current user has admin privileges
 */
export const $isAdmin = computed($userRole, (role) => role === 'ADMIN');

/**
 * Check if current user has moderator or admin privileges
 */
export const $isModerator = computed($userRole, (role) => role === 'MODERATOR' || role === 'ADMIN');

/**
 * Check if user profile is complete (has required fields)
 */
export const $isProfileComplete = computed($currentUser, (user) => {
  if (!user) return false;
  return !!(user.username && user.email);
});

/**
 * User's display name or username fallback
 */
export const $displayName = computed($currentUser, (user) => user?.username || 'Anonymous');

// ============================================================================
// State Actions
// ============================================================================

/**
 * Set the current authenticated user and tokens
 */
export function setAuthenticatedUser(user: AuthUser, accessToken: string, refreshToken: string) {
  $currentUser.set(user);
  $authToken.set(accessToken);
  $refreshToken.set(refreshToken);
  $authError.set(null);

  // Persist authentication data to localStorage
  persistAuthState(user, accessToken, refreshToken);
}

/**
 * Update current user information (e.g., after profile update)
 */
export function updateCurrentUser(updates: Partial<AuthUser>) {
  const currentUser = $currentUser.get();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...updates };
    $currentUser.set(updatedUser);

    // Update persisted data
    const token = $authToken.get();
    const refreshToken = $refreshToken.get();
    if (token && refreshToken) {
      persistAuthState(updatedUser, token, refreshToken);
    }
  }
}

/**
 * Update authentication tokens (e.g., after refresh)
 */
export function updateAuthTokens(accessToken: string, refreshToken: string) {
  $authToken.set(accessToken);
  $refreshToken.set(refreshToken);

  // Update persisted tokens
  const currentUser = $currentUser.get();
  if (currentUser) {
    persistAuthState(currentUser, accessToken, refreshToken);
  }
}

/**
 * Clear authentication state (logout)
 */
export function clearAuthState() {
  $currentUser.set(null);
  $authToken.set(null);
  $refreshToken.set(null);
  $authError.set(null);
  $authLoading.set(false);

  // Clear persisted data
  clearPersistedAuthState();
}

/**
 * Set authentication loading state
 */
export function setAuthLoading(loading: boolean) {
  $authLoading.set(loading);
}

/**
 * Set authentication error
 */
export function setAuthError(error: string | null) {
  $authError.set(error);
}

// ============================================================================
// Persistence Layer
// ============================================================================

const AUTH_STORAGE_KEY = 'glitch_auth';

interface PersistedAuthState {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}

/**
 * Persist authentication state to localStorage
 */
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

/**
 * Load authentication state from localStorage
 */
export function loadPersistedAuthState(): PersistedAuthState | null {
  if (typeof window === 'undefined') return null; // SSR safety

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const authState: PersistedAuthState = JSON.parse(stored);

    // Check if token is expired (basic client-side check)
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

/**
 * Clear persisted authentication state
 */
function clearPersistedAuthState() {
  if (typeof window === 'undefined') return; // SSR safety

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear persisted auth state:', error);
  }
}

/**
 * Initialize authentication state from localStorage on app start
 */
export function initializeAuthState() {
  const persistedState = loadPersistedAuthState();

  if (persistedState) {
    $currentUser.set(persistedState.user);
    $authToken.set(persistedState.accessToken);
    $refreshToken.set(persistedState.refreshToken);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user has specific role
 */
export function hasRole(role: UserRole): boolean {
  const currentRole = $userRole.get();
  if (!currentRole) return false;

  // Admin has all permissions
  if (currentRole === 'ADMIN') return true;

  // Moderator has moderator and user permissions
  if (currentRole === 'MODERATOR' && (role === 'MODERATOR' || role === 'USER')) {
    return true;
  }

  // Exact role match
  return currentRole === role;
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(): boolean {
  return hasRole('ADMIN');
}

/**
 * Check if user can moderate content
 */
export function canModerate(): boolean {
  return hasRole('MODERATOR') || hasRole('ADMIN');
}

/**
 * Get user's avatar URL with fallback
 */
export function getUserAvatarUrl(size: number = 40): string {
  return getAvatarUrl($currentUser.get(), size);
}
