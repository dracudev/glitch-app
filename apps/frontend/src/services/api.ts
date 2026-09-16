import type { ApiResponse, ApiError } from '@glitch/shared-types';
import { $authToken, $refreshToken, clearAuthState, updateAuthTokens } from '@/stores/auth';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  data: unknown;
  expiry: number;
}

// ============================================================================
// Configuration
// ============================================================================

// Server-side (SSR/build): always need absolute URL — Node.js can't resolve relative paths.
// Client-side dev: use Vite proxy (same-origin, no CORS, cookies work natively).
// Client-side prod: use absolute URL (no Vite proxy available, CORS handles cross-origin).
export const API_BASE_URL = (() => {
  if (typeof window === 'undefined') {
    return import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  }
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  return import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1';
})();

const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// ============================================================================
// Types
// ============================================================================

interface RequestConfig extends RequestInit {
  timeout?: number;
  skipAuth?: boolean;
  retryAttempts?: number;
}

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

// ============================================================================
// Core API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private refreshPromise: Promise<void> | null = null;
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || API_CONFIG.baseURL;
    this.timeout = options.timeout || API_CONFIG.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
  }

  /**
   * Make a type-safe HTTP request to the API
   */
  // Add an optional parameter for SSR headers
  async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    // Pass ssrHeaders to buildRequestConfig
    const requestConfig = await this.buildRequestConfig(config, ssrHeaders);

    return this.executeRequest<T>(url, requestConfig);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config: RequestConfig = {}, ssrHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' }, ssrHeaders);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...config,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      ssrHeaders,
    );
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...config,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      ssrHeaders,
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' }, ssrHeaders);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Build the full URL for the request
   */
  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    return `${cleanBaseURL}/${cleanEndpoint}`;
  }

  /**
   * Build the request configuration with headers and authentication
   */
  private async buildRequestConfig(
    config: RequestConfig,
    ssrHeaders?: HeadersInit,
  ): Promise<RequestConfig> {
    const headers = new Headers(this.defaultHeaders);

    // Merge SSR headers (cookies, etc.) on top, preserving defaults
    if (ssrHeaders) {
      const extra = new Headers(ssrHeaders);
      extra.forEach((value, key) => headers.set(key, value));
    }

    // Add custom headers from config
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    if (!config.skipAuth && !ssrHeaders) {
      // Only use $authToken if NOT SSR call
      const token = await this.getValidToken(); // This uses client-side store
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    // For SSR calls with cookies, the 'Cookie' header will be in ssrHeaders

    return {
      ...config,
      headers,
      signal: this.createAbortSignal(config.timeout),
      credentials: 'include',
    };
  }

  /**
   * Cache key for a GET response, or null when the response must not be cached.
   * SSR always returns null: the client is a process-wide singleton, so a
   * cached SSR response leaks one visitor's auth-scoped data to the next.
   */
  private cacheKey(url: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    // Vary by identity so one user never reads another user's cached response.
    return `${url}|${$authToken.get() ?? ''}`;
  }

  /**
   * Execute the HTTP request with error handling and retries
   */
  private async executeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const maxRetries = config.retryAttempts || API_CONFIG.retryAttempts;
    const isGet = !config.method || config.method === 'GET';
    const cacheKey = isGet ? this.cacheKey(url) : null;
    let lastError: Error;

    // ponytail: in-memory cache, add Redis if multi-instance or persistence matters
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        const result = await this.handleResponse<T>(response, config);
        if (cacheKey) {
          this.cache.set(cacheKey, { data: result, expiry: Date.now() + this.cacheTTL });
        } else if (!isGet) {
          // Any write invalidates every cached read.
          this.cache.clear();
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on client errors (4xx) or authentication errors
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await this.delay(API_CONFIG.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Handle the response and parse JSON with error handling
   */
  private async handleResponse<T>(response: Response, config: RequestConfig): Promise<T> {
    // Handle authentication errors — except for requests that opted out of auth
    // (login/register). There a 401 means "bad credentials", and the caller
    // needs the backend's own message, not a refresh + redirect side effect.
    if (response.status === 401 && !config.skipAuth) {
      await this.handleUnauthorized();
      throw new ApiClientError('Authentication required', 401);
    }

    // Handle no-content responses (204/205) gracefully — some endpoints return 204 with no body
    if (response.status === 204 || response.status === 205) {
      // Return undefined for callers expecting no data
      return undefined as unknown as T;
    }

    // Parse response body
    let responseData: ApiResponse<T> | ApiError;
    try {
      responseData = await response.json();
    } catch {
      // If response has no JSON body but isn't a no-content status, surface a helpful error
      throw new ApiClientError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    // Handle error responses
    if (!response.ok) {
      const errorData = responseData as ApiError;
      throw new ApiClientError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.details,
      );
    }

    // Return successful response data
    const successData = responseData as ApiResponse<T>;
    return successData.data;
  }

  /**
   * Get a valid authentication token, refreshing if necessary
   */
  private async getValidToken(): Promise<string | null> {
    const currentToken = $authToken.get();

    if (!currentToken) {
      return null;
    }

    // Check if token needs refresh (basic client-side check)
    if (this.isTokenExpiringSoon(currentToken)) {
      await this.refreshToken();
      return $authToken.get();
    }

    return currentToken;
  }

  /**
   * Refresh the authentication token
   */
  private async refreshToken(): Promise<void> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<void> {
    const refreshToken = $refreshToken.get();

    if (!refreshToken) {
      clearAuthState();
      return;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      updateAuthTokens(data.data.accessToken, data.data.refreshToken);
    } catch {
      // Refresh failed, clear auth state
      clearAuthState();
    }
  }

  /**
   * Handle unauthorized responses
   */
  private async handleUnauthorized(): Promise<void> {
    // Try to refresh token first
    try {
      await this.refreshToken();
    } catch {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }

  /**
   * Check if token is expiring soon (basic client-side check)
   */
  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh if token expires within 5 minutes
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch {
      // If we can't parse the token, assume it needs refresh
      return true;
    }
  }

  /**
   * Create an AbortSignal with timeout
   */
  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (typeof AbortController === 'undefined') {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutMs = timeout || this.timeout;

    setTimeout(() => controller.abort(), timeoutMs);

    return controller.signal;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string[],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * Create a new API client instance with custom configuration
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
