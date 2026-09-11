export const APP_ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    VERIFY_OTP: "/verify-otp",
  },
  CUSTOMER: {
    DASHBOARD: "/customer",
    POST_JOB: "/customer/jobs/new",
    ACTIVE_JOBS: "/customer/jobs",
    PROFILE: "/customer/profile",
  },
  WORKER: {
    DASHBOARD: "/worker",
    OPPORTUNITIES: "/worker/jobs",
    ONBOARDING: "/worker/onboarding",
    EARNINGS: "/worker/earnings",
    PROFILE: "/worker/profile",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    JOBS: "/admin/jobs",
    VERIFICATIONS: "/admin/verifications",
  },
} as const;

export const USER_ROLES = {
  CUSTOMER: "customer",
  WORKER: "worker",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
