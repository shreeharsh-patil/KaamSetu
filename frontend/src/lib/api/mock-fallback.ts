/**
 * Development & Offline Mock Handlers for KaamSetu API Client
 * Activated seamlessly when the Express backend (localhost:5000) is offline or unreachable.
 */

import { API_ENDPOINTS } from "./endpoints";

export function handleOfflineMockResponse<T>(
  endpoint: string,
  _method: string = "GET",
  body?: unknown
): T | null {
  const normalizedEndpoint = endpoint.replace(/^\/api\/v1/, "");
  const payload = body as Record<string, unknown> | undefined;

  // 1. Request OTP
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.REQUEST_OTP)) {
    const phone = (payload?.phone as string) || "+919820011223";
    return {
      success: true,
      phone,
      expiresIn: 300,
      debugOtp: "123456",
      message: "OTP sent successfully (Demo OTP: 123456)",
    } as T;
  }

  // 2. Verify OTP
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.VERIFY_OTP)) {
    const phone = (payload?.phone as string) || "+919820011223";
    const pendingRole =
      (typeof window !== "undefined"
        ? sessionStorage.getItem("kaamsetu_pending_role")
        : null) || "customer";

    const mockUser = {
      id: `usr-${phone.replace(/\D/g, "").slice(-4) || "demo"}`,
      phoneNumber: phone,
      role: (pendingRole === "worker" ? "worker" : "customer") as "customer" | "worker",
      status: "active",
      fullName: pendingRole === "worker" ? "Rajesh Kumar (Pro)" : "Anand Verma (Customer)",
      phoneVerified: true,
      preferredLanguage: "en",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("kaamsetu_user", JSON.stringify(mockUser));
      localStorage.setItem("kaamsetu_token", `mock-token-${Date.now()}`);
      document.cookie = `kaamsetu_user=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=604800`;
    }

    return {
      user: mockUser,
      accessToken: `mock-token-${Date.now()}`,
    } as T;
  }

  // 3. Token Refresh
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.REFRESH)) {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("kaamsetu_user");
      if (savedUser) {
        return {
          accessToken: `mock-refreshed-token-${Date.now()}`,
        } as T;
      }
    }
    return null;
  }

  // 4. Current User Profile (/me)
  if (normalizedEndpoint === API_ENDPOINTS.USERS.ME || normalizedEndpoint === "/me") {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("kaamsetu_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser) as T;
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  // 5. Logout
  if (normalizedEndpoint.includes(API_ENDPOINTS.AUTH.LOGOUT)) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("kaamsetu_user");
      localStorage.removeItem("kaamsetu_token");
      sessionStorage.removeItem("kaamsetu_pending_phone");
      sessionStorage.removeItem("kaamsetu_pending_role");
      document.cookie = "kaamsetu_user=; path=/; max-age=0";
    }
    return { success: true } as T;
  }

  return null;
}
