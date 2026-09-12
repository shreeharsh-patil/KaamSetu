"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient, setAccessToken, setOnAuthFailure } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { User, RequestOtpResponse, VerifyOtpResponse } from "./types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string | null;
  setPendingPhone: (phone: string | null) => void;
  requestOtp: (phone: string, rolePreference?: "customer" | "worker") => Promise<RequestOtpResponse>;
  verifyOtp: (phone: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhoneState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("kaamsetu_pending_phone");
    }
    return null;
  });

  const setPendingPhone = useCallback((phone: string | null) => {
    setPendingPhoneState(phone);
    if (typeof window !== "undefined") {
      if (phone) {
        sessionStorage.setItem("kaamsetu_pending_phone", phone);
      } else {
        sessionStorage.removeItem("kaamsetu_pending_phone");
      }
    }
  }, []);

  const handleUpdateToken = useCallback((token: string | null) => {
    setTokenState(token);
    setAccessToken(token);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient<{ user: User }>(API_ENDPOINTS.USERS.ME);
      setUser(userData.user);
    } catch {
      setUser(null);
    }
  }, []);

  // Initial session hydration
  useEffect(() => {
    let isSubscribed = true;

    async function initSession() {
      try {
        const refreshData = await apiClient<{ accessToken: string }>(
          API_ENDPOINTS.AUTH.REFRESH,
          { method: "POST", skipAuth: true }
        );

        if (isSubscribed && refreshData?.accessToken) {
          handleUpdateToken(refreshData.accessToken);
          const userData = await apiClient<{ user: User }>(API_ENDPOINTS.USERS.ME);
          if (isSubscribed && userData.user) {
            setUser(userData.user);
          }
        }
      } catch {
        if (isSubscribed) {
          handleUpdateToken(null);
          setUser(null);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    setOnAuthFailure(() => {
      if (isSubscribed) {
        handleUpdateToken(null);
        setUser(null);
      }
    });

    initSession();

    return () => {
      isSubscribed = false;
    };
  }, [handleUpdateToken]);

  const requestOtp = useCallback(
    async (phone: string, rolePreference?: "customer" | "worker"): Promise<RequestOtpResponse> => {
      setPendingPhone(phone);
      if (rolePreference && typeof window !== "undefined") {
        sessionStorage.setItem("kaamsetu_pending_role", rolePreference);
      }
      const res = await apiClient<RequestOtpResponse>(
        API_ENDPOINTS.AUTH.REQUEST_OTP,
        {
          method: "POST",
          body: { phone },
          skipAuth: true,
        }
      );
      return res;
    },
    [setPendingPhone]
  );

  const verifyOtp = useCallback(
    async (phone: string, otp: string): Promise<User> => {
      const res = await apiClient<VerifyOtpResponse>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        {
          method: "POST",
          body: {
            phone,
            otp,
            deviceName: typeof navigator !== "undefined" ? navigator.userAgent : "web-client",
          },
          skipAuth: true,
        }
      );

      handleUpdateToken(res.accessToken);
      setUser(res.user);
      setPendingPhone(null);
      return res.user;
    },
    [handleUpdateToken, setPendingPhone]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      handleUpdateToken(null);
      setUser(null);
      setPendingPhone(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("kaamsetu_pending_phone");
        sessionStorage.removeItem("kaamsetu_pending_role");
      }
    }
  }, [handleUpdateToken, setPendingPhone]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: Boolean(user),
        isLoading,
        pendingPhone,
        setPendingPhone,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
