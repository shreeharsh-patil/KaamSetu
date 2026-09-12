export type UserRole = "CUSTOMER" | "WORKER" | "SUPPORT" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";

export interface User {
  id: string;
  phoneNumber: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string;
  email?: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  requiresProfileCompletion?: boolean;
  preferredLanguage?: string;
  profilePhotoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface RequestOtpPayload {
  phone?: string;
  identifier?: string;
}

export interface RequestOtpResponse {
  message: string;
  cooldownSeconds: number;
  phone?: string;
  devHint?: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  deviceName?: string;
}

export interface VerifyOtpResponse {
  user: User;
  accessToken: string;
  requiresProfileCompletion?: boolean;
}

export interface SignupRequestOtpPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: "CUSTOMER" | "WORKER";
}

export interface CompleteProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}
