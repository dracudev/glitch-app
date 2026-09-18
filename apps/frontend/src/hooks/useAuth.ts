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

// ── Types

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

// ── Hook Implementation

export function useAuth(): UseAuthReturn {
  const user = useStore($currentUser);
  const authToken = useStore($authToken);
  const isLoading = useStore($authLoading);
  const error = useStore($authError);

  const isAuthenticated = !!user && !!authToken;

  // ── Auth Actions (wrapped service calls)

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

  // ── Effects

  useEffect(() => {
    if (authToken && !user) {
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

// ── Specialized Auth Hooks

export function useRequireAuth(): UseAuthReturn {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return auth;
}

export function useGuestOnly(): UseAuthReturn {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/feed';
      }
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  return auth;
}
