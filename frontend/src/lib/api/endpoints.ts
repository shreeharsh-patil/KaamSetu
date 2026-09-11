export const API_ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: "/auth/request-otp",
    VERIFY_OTP: "/auth/verify-otp",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
    SESSIONS: "/auth/sessions",
  },
  USERS: {
    ME: "/me",
    UPDATE_PROFILE: "/users/profile",
  },
  CATEGORIES: {
    LIST: "/categories",
    DETAIL: (slug: string) => `/categories/${slug}`,
  },
  JOBS: {
    LIST: "/jobs",
    CREATE: "/jobs",
    DETAIL: (id: string) => `/jobs/${id}`,
    OFFERS: (jobId: string) => `/jobs/${jobId}/offers`,
  },
  WORKERS: {
    NEARBY: "/workers/nearby",
    PROFILE: (id: string) => `/workers/${id}`,
    AVAILABILITY: "/workers/availability",
  },
} as const;
