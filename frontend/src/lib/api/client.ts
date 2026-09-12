import { env } from "@/config/env";
import { ApiError, type ApiErrorPayload } from "./errors";
import { API_ENDPOINTS } from "./endpoints";

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

  const apiOrigin = new URL(env.NEXT_PUBLIC_API_URL).origin;
  const requestOrigin = new URL(url).origin;
  // Never leak bearer credentials to an arbitrary absolute URL.
  if (!skipAuth && requestOrigin === apiOrigin && inMemoryAccessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  // Generate request ID for traceability
  if (!headers.has("X-Request-Id")) {
    const requestId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    headers.set("X-Request-Id", `web-${requestId}`);
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // propagate HttpOnly refresh cookie
      body: body instanceof FormData || typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
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
      const method = (fetchOptions.method ?? "GET").toUpperCase();
      const mayReplay = ["GET", "HEAD", "OPTIONS"].includes(method) || headers.has("Idempotency-Key");
      if (refreshedToken && mayReplay) {
        // Retry the original request with the fresh token
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);
        try {
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: "include",
            body: body instanceof FormData || typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
            signal: retryController.signal,
          });
          const retryRequestId = retryResponse.headers.get("x-request-id") || undefined;
          const retryType = retryResponse.headers.get("content-type") || "";
          const retryData = retryResponse.status === 204
            ? {}
            : retryType.includes("application/json") ? await retryResponse.json() : await retryResponse.text();
          if (!retryResponse.ok) {
            const payload = (retryData as ApiErrorPayload) || {};
            throw new ApiError(payload.error?.message || payload.message || `Request failed with status ${retryResponse.status}`, retryResponse.status, payload.error?.code || `HTTP_${retryResponse.status}`, payload.error?.details || payload.errors, retryRequestId);
          }
          return (retryData && typeof retryData === "object" && "data" in retryData
            ? (retryData as { data: T }).data
            : retryData) as T;
        } finally {
          clearTimeout(retryTimeoutId);
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

