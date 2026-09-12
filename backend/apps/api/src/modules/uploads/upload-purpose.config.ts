import { UploadPurpose } from '@kaamsetu/types';

export interface PurposeConfig {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
  isPublic: boolean;
}

export const PURPOSE_CONFIGS: Record<UploadPurpose, PurposeConfig> = {
  [UploadPurpose.PROFILE_PHOTO]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    isPublic: true,
  },
  [UploadPurpose.WORKER_PORTFOLIO]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPublic: true,
  },
  [UploadPurpose.JOB_IMAGE]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPublic: true,
  },
  [UploadPurpose.EXPENSE_RECEIPT]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPublic: false, // Private: requires signed download URL
  },
  [UploadPurpose.VERIFICATION_DOCUMENT]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    isPublic: false, // Strictly Private: do not expose publicly!
  },
};

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
};

/**
 * Validates that the filename extension is compatible with the specified MIME type.
 */
export function isExtensionCompatibleWithMime(extension: string, mimeType: string): boolean {
  const allowed = MIME_EXTENSION_MAP[mimeType.toLowerCase()];
  if (!allowed) return false;
  return allowed.includes(extension.toLowerCase());
}
