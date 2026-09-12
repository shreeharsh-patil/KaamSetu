import type { IStorageProvider } from '@kaamsetu/types';

interface StoredMetadata {
  key: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export class MockStorageProvider implements IStorageProvider {
  public readonly name: string = 'mock-storage';

  private objects: Map<string, StoredMetadata> = new Map();
  private shouldFailVerification: boolean = false;
  private shouldFailPresign: boolean = false;
  private autoSimulateUpload: boolean = true;

  public setShouldFailVerification(val: boolean): void {
    this.shouldFailVerification = val;
  }

  public setShouldFailPresign(val: boolean): void {
    this.shouldFailPresign = val;
  }

  public setAutoSimulateUpload(val: boolean): void {
    this.autoSimulateUpload = val;
  }

  public clear(): void {
    this.objects.clear();
    this.shouldFailVerification = false;
    this.shouldFailPresign = false;
    this.autoSimulateUpload = true;
  }

  /**
   * Generates a deterministic mock presigned upload URL.
   */
  async createPresignedUploadUrl(
    key: string,
    mimeType: string,
    maxSizeBytes: number,
    expiresInSeconds: number = 900
  ): Promise<{
    uploadUrl: string;
    expiresInSeconds: number;
    requiredHeaders?: Record<string, string>;
  }> {
    if (this.shouldFailPresign) {
      throw new Error('Storage provider unavailable (presign failed)');
    }

    if (this.autoSimulateUpload) {
      // Auto-simulate that the file will be placed in object storage when client uploads
      this.objects.set(key, {
        key,
        mimeType,
        sizeBytes: maxSizeBytes,
        uploadedAt: new Date(),
      });
    }

    const uploadUrl = `https://storage.kaamsetu.test/upload/${key}?expires=${expiresInSeconds}&sig=mock-sig`;
    return {
      uploadUrl,
      expiresInSeconds,
      requiredHeaders: {
        'content-type': mimeType,
      },
    };
  }

  /**
   * Generates a deterministic mock presigned download URL for private files.
   */
  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 900
  ): Promise<{
    downloadUrl: string;
    expiresInSeconds: number;
  }> {
    const downloadUrl = `https://storage.kaamsetu.test/download/${key}?expires=${expiresInSeconds}&sig=mock-dl-sig`;
    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  /**
   * Verifies that the object exists in storage and returns metadata.
   */
  async verifyObjectMetadata(
    key: string
  ): Promise<{ exists: boolean; sizeBytes?: number; mimeType?: string }> {
    if (this.shouldFailVerification) {
      return { exists: false };
    }

    const item = this.objects.get(key);
    if (!item) {
      return { exists: false };
    }

    return {
      exists: true,
      sizeBytes: item.sizeBytes,
      mimeType: item.mimeType,
    };
  }

  /**
   * Deletes the object from storage.
   */
  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  /**
   * Returns public CDN URL for public assets.
   */
  getPublicUrl(key: string): string {
    return `https://cdn.kaamsetu.test/${key}`;
  }
}

export const mockStorageProvider = new MockStorageProvider();
