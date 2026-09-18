import type { ApiResponse, ApiError } from '@glitch/shared-types';
import { $authToken, $refreshToken, clearAuthState, updateAuthTokens } from '@/stores/auth';

// ── Types

interface CacheEntry {
  data: unknown;
  expiry: number;
}

// ── Configuration

// SSR needs an absolute URL; the browser stays same-origin so the auth cookie is first-party.
export const API_BASE_URL = (() => {
  if (typeof window === 'undefined') {
    return import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  }
  return '/api/v1';
})();

const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// ── Types

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

// ── Core API Client Class

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

  async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    const url = this.buildURL(endpoint);
    const requestConfig = await this.buildRequestConfig(config, ssrHeaders);

    return this.executeRequest<T>(url, requestConfig);
  }

  async get<T>(endpoint: string, config: RequestConfig = {}, ssrHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' }, ssrHeaders);
  }

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

  async delete<T>(
    endpoint: string,
    config: RequestConfig = {},
    ssrHeaders?: HeadersInit,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' }, ssrHeaders);
  }

  // ── Private Helper Methods

  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    return `${cleanBaseURL}/${cleanEndpoint}`;
  }

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

    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    if (!config.skipAuth && !ssrHeaders) {
      const token = await this.getValidToken();
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

  /** GET cache key; null on SSR so one visitor's auth-scoped data never leaks to the next. */
  private cacheKey(url: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    // Vary by identity so one user never reads another user's cached response.
    return `${url}|${$authToken.get() ?? ''}`;
  }

  /** Execute the HTTP request with error handling and retries. */
  private async executeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const maxRetries = config.retryAttempts || API_CONFIG.retryAttempts;
    const isGet = !config.method || config.method === 'GET';
    const cacheKey = isGet ? this.cacheKey(url) : null;
    let lastError: Error;

    // In-memory cache; add Redis if multi-instance or persistence matters.
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

  private async handleResponse<T>(response: Response, config: RequestConfig): Promise<T> {
    // On skipAuth requests (login/register) a 401 means bad credentials — let the backend message through.
    if (response.status === 401 && !config.skipAuth) {
      await this.handleUnauthorized();
      throw new ApiClientError('Authentication required', 401);
    }

    // Some endpoints return 204 with no body.
    if (response.status === 204 || response.status === 205) {
      return undefined as unknown as T;
    }

    let responseData: ApiResponse<T> | ApiError;
    try {
      responseData = await response.json();
    } catch {
      // No JSON body and not a no-content status.
      throw new ApiClientError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    if (!response.ok) {
      const errorData = responseData as ApiError;
      throw new ApiClientError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.details,
      );
    }

    const successData = responseData as ApiResponse<T>;
    return successData.data;
  }

  /** Get a valid token, refreshing first if it is expiring soon. */
  private async getValidToken(): Promise<string | null> {
    const currentToken = $authToken.get();

    if (!currentToken) {
      return null;
    }

    if (this.isTokenExpiringSoon(currentToken)) {
      await this.refreshToken();
      return $authToken.get();
    }

    return currentToken;
  }

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
      clearAuthState();
    }
  }

  private async handleUnauthorized(): Promise<void> {
    try {
      await this.refreshToken();
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }

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

  private createAbortSignal(timeout?: number): AbortSignal | undefined {
    if (typeof AbortController === 'undefined') {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutMs = timeout || this.timeout;

    setTimeout(() => controller.abort(), timeoutMs);

    return controller.signal;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Custom Error Class

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

// ── Singleton Instance

export const apiClient = new ApiClient();

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
