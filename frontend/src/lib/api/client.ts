import { env } from "@/config/env";
import { ApiError, type ApiErrorPayload } from "./errors";
import { API_ENDPOINTS } from "./endpoints";
import { handleOfflineMockResponse } from "./mock-fallback";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setOnAuthFailure(callback: () => void): void {
  onAuthFailureCallback = callback;
}

/**
 * Universal typed API Client for communication between Next.js and Express backend.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    params,
    headers: customHeaders,
    timeoutMs = 15000,
    skipAuth = false,
    ...fetchOptions
  } = options;

  // Build query parameters
  let url = endpoint.startsWith("http")
    ? endpoint
    : `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      url += (url.includes("?") ? "&" : "?") + query;
    }
  }

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Setup request headers
  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // Inject Bearer access token
  if (!skipAuth && inMemoryAccessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  // Generate request ID for traceability
  if (!headers.has("X-Request-Id")) {
    headers.set("X-Request-Id", `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // propagate HttpOnly refresh cookie
      body: body instanceof FormData || typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    }).catch((fetchError) => {
      // In development or when backend is offline, catch fetch network errors immediately to prevent browser unhandledRejection
      const mock = handleOfflineMockResponse<T>(endpoint, fetchOptions.method || "GET", body);
      if (mock !== null) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true, data: mock }),
          text: async () => JSON.stringify({ success: true, data: mock }),
        } as unknown as Response;
      }
      throw fetchError;
    });

    clearTimeout(timeoutId);

    const requestId = response.headers.get("x-request-id") || undefined;

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Handle 401 Unauthorized with automatic silent token refresh
    if (response.status === 401 && !skipAuth && !endpoint.includes("/auth/")) {
      const refreshedToken = await handleSilentTokenRefresh();
      if (refreshedToken) {
        // Retry the original request with the fresh token
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: "include",
          body: body instanceof FormData || typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
        }).catch(() => null);

        if (retryResponse && retryResponse.ok) {
          const retryData = await retryResponse.json();
          return (retryData.data ?? retryData) as T;
        }
      } else {
        onAuthFailureCallback?.();
      }
    }

    // Parse JSON or text response
    const contentType = response.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorPayload = (data as ApiErrorPayload) || {};
      const errorMessage =
        errorPayload.error?.message ||
        errorPayload.message ||
        `Request failed with status ${response.status}`;
      const errorCode = errorPayload.error?.code || `HTTP_${response.status}`;
      const errorDetails = errorPayload.error?.details || errorPayload.errors;

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails, requestId);
    }

    // Backend typically wraps responses in { success: true, data: T }
    if (data && typeof data === "object" && "data" in data) {
      return (data as { data: T }).data;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request timed out", 408, "REQUEST_TIMEOUT");
    }

    // If backend is offline / unreachable, gracefully check for mock fallback
    const mockResponse = handleOfflineMockResponse<T>(endpoint, fetchOptions.method || "GET", body);
    if (mockResponse !== null) {
      return mockResponse;
    }

    throw new ApiError(
      err instanceof Error ? err.message : "Network error occurred",
      0,
      "NETWORK_ERROR"
    );
  }
}

/**
 * Deduplicated silent refresh runner.
 */
async function handleSilentTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshUrl = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${API_ENDPOINTS.AUTH.REFRESH}`;
      const response = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setAccessToken(null);
        return null;
      }

      const resData = await response.json();
      const newToken = resData.data?.accessToken || resData.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        return newToken;
      }

      setAccessToken(null);
      return null;
    } catch {
      const mock = handleOfflineMockResponse<{ accessToken: string }>(API_ENDPOINTS.AUTH.REFRESH);
      if (mock?.accessToken) {
        setAccessToken(mock.accessToken);
        return mock.accessToken;
      }
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.get = <T>(endpoint: string, options?: RequestOptions): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

apiClient.post = <T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: "POST", body });
};

apiClient.put = <T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: "PUT", body });
};

apiClient.patch = <T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: "PATCH", body });
};

apiClient.delete = <T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};

