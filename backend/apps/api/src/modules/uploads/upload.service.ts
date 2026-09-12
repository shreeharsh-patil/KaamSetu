import crypto from 'crypto';
import path from 'path';
import {
  UploadStatus,
  UserRole,
  type IUploadEntity,
  type IPresignedUploadResult,
  type IPresignedDownloadResult,
} from '@kaamsetu/types';
import type { PresignUploadInputDto } from '@kaamsetu/validation';
import { uploadRepository, IUploadRepository } from './upload.repository.js';
import { storageProviderRegistry } from './providers/storage-provider.registry.js';
import {
  PURPOSE_CONFIGS,
  isExtensionCompatibleWithMime,
} from './upload-purpose.config.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../errors/index.js';

export class UploadService {
  constructor(private uploadRepo: IUploadRepository = uploadRepository) {}

  /**
   * 1. Authenticated client requests upload authorization.
   * 2. Backend validates purpose, MIME type, extension, and file size.
   * 3. Backend generates a random, cryptographically secure object key (Never trust user filename).
   * 4. Backend creates a short-lived presigned upload URL.
   * 5. Backend stores a pending database record.
   */
  async createPresignedUpload(
    userId: string,
    input: PresignUploadInputDto
  ): Promise<IPresignedUploadResult> {
    const config = PURPOSE_CONFIGS[input.purpose];
    if (!config) {
      throw new BadRequestError(`Unsupported upload purpose: ${input.purpose}`);
    }

    // Validate MIME type against purpose
    const normalizedMime = input.mimeType.toLowerCase().trim();
    if (!config.allowedMimeTypes.includes(normalizedMime)) {
      throw new BadRequestError(
        `Invalid MIME type "${normalizedMime}" for purpose ${input.purpose}. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      );
    }

    // Extract & validate extension from original filename
    const sanitizedOriginalFilename = path.basename(input.filename.trim());
    const dotIndex = sanitizedOriginalFilename.lastIndexOf('.');
    const ext = dotIndex !== -1 ? sanitizedOriginalFilename.slice(dotIndex + 1).toLowerCase() : '';

    if (!ext || !config.allowedExtensions.includes(ext)) {
      throw new BadRequestError(
        `Invalid file extension ".${ext}" for purpose ${input.purpose}. Allowed extensions: ${config.allowedExtensions.join(', ')}`
      );
    }

    // Ensure extension matches the specified MIME type
    if (!isExtensionCompatibleWithMime(ext, normalizedMime)) {
      throw new BadRequestError(
        `File extension ".${ext}" does not match MIME type "${normalizedMime}"`
      );
    }

    // Validate size limit against purpose
    if (input.sizeBytes > config.maxSizeBytes) {
      const maxMb = Math.round(config.maxSizeBytes / (1024 * 1024));
      throw new BadRequestError(
        `File size (${input.sizeBytes} bytes) exceeds maximum allowable size of ${maxMb}MB for ${input.purpose}`
      );
    }

    // Generate random object key — Never trust user filename!
    const randomSuffix = crypto.randomUUID();
    const timestamp = Date.now();
    const key = `uploads/${input.purpose.toLowerCase()}/${userId}/${timestamp}-${randomSuffix}.${ext}`;

    const storageProvider = storageProviderRegistry.getProvider();
    const presigned = await storageProvider.createPresignedUploadUrl(
      key,
      normalizedMime,
      input.sizeBytes,
      900 // 15 minutes expiry
    );

    // Store pending upload record
    const upload = await this.uploadRepo.create({
      userId,
      purpose: input.purpose,
      key,
      originalFilename: sanitizedOriginalFilename,
      mimeType: normalizedMime,
      sizeBytes: input.sizeBytes,
      isPublic: config.isPublic,
      metadata: {
        extension: ext,
      },
    });

    return {
      uploadId: upload.id,
      uploadUrl: presigned.uploadUrl,
      key,
      expiresInSeconds: presigned.expiresInSeconds,
      requiredHeaders: presigned.requiredHeaders,
    };
  }

  /**
   * 6. Client confirms upload.
   * 7. Backend verifies metadata with object storage.
   * 8. Backend stores confirmed file record and sets publicUrl if applicable.
   */
  async completeUpload(userId: string, uploadId: string): Promise<IUploadEntity> {
    const upload = await this.uploadRepo.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload record not found');
    }

    // Verify ownership
    if (upload.userId !== userId) {
      throw new ForbiddenError('You can only complete your own uploads');
    }

    // If already completed, idempotent return
    if (upload.status === UploadStatus.COMPLETED) {
      return upload;
    }

    const storageProvider = storageProviderRegistry.getProvider();

    // Verify object actually exists in object storage
    const metadata = await storageProvider.verifyObjectMetadata(upload.key);
    if (!metadata.exists) {
      throw new BadRequestError(
        'File has not been uploaded to object storage yet. Please upload file before confirming.'
      );
    }

    // Public URL only generated for public assets (PROFILE_PHOTO, WORKER_PORTFOLIO, JOB_IMAGE)
    // Never expose private verification documents or receipts publicly!
    let publicUrl: string | null = null;
    if (upload.isPublic) {
      publicUrl = storageProvider.getPublicUrl(upload.key);
    }

    const completed = await this.uploadRepo.updateStatus(
      upload.id,
      UploadStatus.COMPLETED,
      publicUrl
    );

    if (!completed) {
      throw new NotFoundError('Failed to update upload status');
    }

    return completed;
  }

  /**
   * Deletes the file from storage and database.
   */
  async deleteUpload(
    userId: string,
    userRole: UserRole,
    uploadId: string
  ): Promise<{ message: string }> {
    const upload = await this.uploadRepo.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload record not found');
    }

    // Ownership check: only owner or ADMIN can delete
    if (upload.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You can only delete your own uploads');
    }

    const storageProvider = storageProviderRegistry.getProvider();
    await storageProvider.deleteObject(upload.key);
    await this.uploadRepo.delete(upload.id);

    return { message: 'File deleted successfully' };
  }

  /**
   * Generates short-lived presigned download URL for private documents.
   */
  async getDownloadUrl(
    userId: string,
    userRole: UserRole,
    uploadId: string
  ): Promise<IPresignedDownloadResult> {
    const upload = await this.uploadRepo.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload record not found');
    }

    // Private files (VERIFICATION_DOCUMENT, EXPENSE_RECEIPT) can only be accessed by owner, ADMIN, or SUPPORT
    if (!upload.isPublic) {
      const isOwner = upload.userId === userId;
      const isStaff = userRole === UserRole.ADMIN || userRole === UserRole.SUPPORT;

      if (!isOwner && !isStaff) {
        throw new ForbiddenError('You do not have permission to access this private document');
      }
    }

    const storageProvider = storageProviderRegistry.getProvider();
    return storageProvider.createPresignedDownloadUrl(upload.key, 900);
  }

  /**
   * Retrieves upload record by ID.
   */
  async getUploadById(
    userId: string,
    userRole: UserRole,
    uploadId: string
  ): Promise<IUploadEntity> {
    const upload = await this.uploadRepo.findById(uploadId);
    if (!upload) {
      throw new NotFoundError('Upload record not found');
    }

    if (!upload.isPublic) {
      const isOwner = upload.userId === userId;
      const isStaff = userRole === UserRole.ADMIN || userRole === UserRole.SUPPORT;

      if (!isOwner && !isStaff) {
        throw new ForbiddenError('You do not have permission to access this private document');
      }
    }

    return upload;
  }
}

export const uploadService = new UploadService();
