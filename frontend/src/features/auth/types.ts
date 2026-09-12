export type UserRole = "customer" | "worker" | "admin";
export type UserStatus = "active" | "suspended" | "pending";

export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  fullName?: string;
  email?: string | null;
  phoneVerified: boolean;
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
  phone: string;
}

export interface RequestOtpResponse {
  phone: string;
  expiresIn: number;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  deviceName?: string;
}

export interface VerifyOtpResponse {
  user: User;
  accessToken: string;
}
