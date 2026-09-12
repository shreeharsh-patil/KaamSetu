export interface AdminStats {
  totalUsers: number;
  totalWorkers: number;
  verifiedWorkers: number;
  activeJobs: number;
  completedJobs: number;
  openDisputes: number;
  platformGmv: number;
}

export interface AdminUser {
  id: string;
  phoneNumber: string;
  phone?: string;
  name?: string;
  role: "CUSTOMER" | "WORKER" | "ADMIN" | "SUPPORT";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface AdminWorker {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  category?: string;
  skills: string[];
  verificationStatus: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "UNVERIFIED";
  availabilityStatus?: "AVAILABLE" | "BUSY" | "OFFLINE";
  isSuspended?: boolean;
  locality?: string;
  createdAt: string;
}

export interface AdminJob {
  id: string;
  title: string;
  category: string;
  customerName: string;
  workerName?: string;
  status: string;
  price?: number;
  locality: string;
  createdAt: string;
}

export interface AdminVerificationRequest {
  id: string;
  workerId: string;
  workerName: string;
  category: string;
  skills: string[];
  experienceYears: number;
  documents: Array<{ type: string; url: string }>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

export interface AdminDispute {
  id: string;
  jobId: string;
  jobTitle: string;
  initiatorRole: "CUSTOMER" | "WORKER";
  initiatorName: string;
  respondentName: string;
  amount: number;
  reason: string;
  status: "OPEN" | "RESOLVED" | "REJECTED" | "CLOSED";
  createdAt: string;
}

export interface ResolveDisputePayload {
  status: "RESOLVED" | "REJECTED";
  summary: string;
  refundPaise?: number;
  actionTaken?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId: string;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}
