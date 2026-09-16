import { useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  AuthResponse,
} from '@glitch/shared-types';

import { login, register, logout, changePassword, verifyAuthentication } from '@/services/auth';
import { $currentUser, $authToken, $authLoading, $authError, setAuthError } from '@/stores/auth';

// ============================================================================
// Types
// ============================================================================

interface UseAuthReturn {
  // State
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;

  // Utils
  checkAuth: () => Promise<boolean>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Authentication hook that provides user state and auth actions
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { login, isLoading, error, clearError } = useAuth();
 *
 *   const handleSubmit = async (credentials: LoginRequest) => {
 *     try {
 *       await login(credentials);
 *       navigate('/feed');
 *     } catch (err) {
 *       // Error is already handled in the hook
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <ErrorMessage message={error} onClose={clearError} />}
 *       <button disabled={isLoading}>
 *         {isLoading ? 'Logging in...' : 'Login'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  // Subscribe to global auth stores
  const user = useStore($currentUser);
  const authToken = useStore($authToken);
  const isLoading = useStore($authLoading);
  const error = useStore($authError);

  // Derived state
  const isAuthenticated = !!user && !!authToken;

  // ============================================================================
  // Auth Actions (wrapped service calls)
  // ============================================================================

  const loginUser = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    return await login(credentials);
  }, []);

  const registerUser = useCallback(async (userData: RegisterRequest): Promise<AuthResponse> => {
    return await register(userData);
  }, []);

  const logoutUser = useCallback(async (): Promise<void> => {
    await logout();
  }, []);

  const updatePassword = useCallback(async (passwordData: ChangePasswordRequest): Promise<void> => {
    await changePassword(passwordData);
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    return await verifyAuthentication();
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Optional: Auto-verify authentication on mount
  useEffect(() => {
    if (authToken && !user) {
      // If we have a token but no user, verify authentication
      checkAuth().catch(() => {
        // Ignore errors, let the auth service handle token cleanup
      });
    }
  }, [authToken, user, checkAuth]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    changePassword: updatePassword,
    clearError: clearAuthError,

    // Utils
    checkAuth,
  };
}

// ============================================================================
// Specialized Auth Hooks
// ============================================================================

/**
 * Hook for protecting routes - redirects if not authenticated
 */
export function useRequireAuth(): UseAuthReturn {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return auth;
}

/**
 * Hook for guest-only routes - redirects if authenticated
 */
export function useGuestOnly(): UseAuthReturn {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      // Redirect to dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/feed';
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return auth;
}
