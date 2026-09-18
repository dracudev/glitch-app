import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TokenResponse,
} from '@glitch/shared-types';

import { apiClient } from './api';
import {
  setAuthenticatedUser,
  clearAuthState,
  setAuthLoading,
  setAuthError,
  updateAuthTokens,
} from '@/stores/auth';

// ── Authentication Functions

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  setAuthLoading(true);
  setAuthError(null);

  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, {
      skipAuth: true,
    });

    setAuthenticatedUser(response.user, response.accessToken, response.refreshToken);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    setAuthError(errorMessage);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}

export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  setAuthLoading(true);
  setAuthError(null);

  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData, {
      skipAuth: true,
    });

    setAuthenticatedUser(response.user, response.accessToken, response.refreshToken);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    setAuthError(errorMessage);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}

export async function logout(): Promise<void> {
  setAuthLoading(true);

  try {
    // Call logout endpoint to invalidate server-side session
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Continue with logout even if server request fails
    console.warn('Logout request failed:', error);
  } finally {
    clearAuthState();
    setAuthLoading(false);

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

export async function refreshTokens(): Promise<TokenResponse> {
  try {
    const response = await apiClient.post<TokenResponse>('/auth/refresh');

    updateAuthTokens(response.accessToken, response.refreshToken);

    return response;
  } catch (error) {
    clearAuthState();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw error;
  }
}

export async function changePassword(passwordData: ChangePasswordRequest): Promise<void> {
  setAuthLoading(true);
  setAuthError(null);

  try {
    await apiClient.post('/auth/change-password', passwordData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Password change failed';
    setAuthError(errorMessage);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}

export async function forgotPassword(emailData: ForgotPasswordRequest): Promise<void> {
  setAuthLoading(true);
  setAuthError(null);

  try {
    await apiClient.post('/auth/forgot-password', emailData, {
      skipAuth: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
    setAuthError(errorMessage);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}

export async function resetPassword(resetData: ResetPasswordRequest): Promise<void> {
  setAuthLoading(true);
  setAuthError(null);

  try {
    await apiClient.post('/auth/reset-password', resetData, {
      skipAuth: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
    setAuthError(errorMessage);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}

/** Get current user profile (authenticated). */
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  try {
    const user = await apiClient.get<AuthResponse['user']>('/auth/me');
    return user;
  } catch (error) {
    // If getting current user fails, might be due to expired token
    clearAuthState();
    throw error;
  }
}

// ── Utility Functions

export async function verifyAuthentication(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function initializeAuth(): Promise<void> {
  try {
    const isValid = await verifyAuthentication();
    if (!isValid) {
      clearAuthState();
    }
  } catch {
    clearAuthState();
  }
}
