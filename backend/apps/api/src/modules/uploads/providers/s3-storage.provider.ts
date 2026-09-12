import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageProvider } from '@kaamsetu/types';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
  cdnBaseUrl?: string;
}

export class S3StorageProvider implements IStorageProvider {
  public readonly name: string = 's3-storage';
  private client: S3Client;
  private bucket: string;
  private cdnBaseUrl?: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.cdnBaseUrl = config.cdnBaseUrl;

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    });
  }

  /**
   * Generates a short-lived presigned URL for direct client PUT upload.
   */
  async createPresignedUploadUrl(
    key: string,
    mimeType: string,
    _maxSizeBytes: number,
    expiresInSeconds: number = 900
  ): Promise<{
    uploadUrl: string;
    expiresInSeconds: number;
    requiredHeaders?: Record<string, string>;
  }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      expiresInSeconds,
      requiredHeaders: {
        'content-type': mimeType,
      },
    };
  }

  /**
   * Generates a short-lived presigned URL for secure download of private files.
   */
  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 900
  ): Promise<{
    downloadUrl: string;
    expiresInSeconds: number;
  }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  /**
   * Verifies metadata of the uploaded object via HEAD request.
   */
  async verifyObjectMetadata(
    key: string
  ): Promise<{ exists: boolean; sizeBytes?: number; mimeType?: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const res: HeadObjectCommandOutput = await this.client.send(command);
      return {
        exists: true,
        sizeBytes: res.ContentLength,
        mimeType: res.ContentType,
      };
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name;
      const httpCode = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;

      if (errorName === 'NotFound' || httpCode === 404) {
        return { exists: false };
      }
      throw err;
    }
  }

  /**
   * Deletes the object from object storage.
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Returns public URL for publicly accessible assets.
   */
  getPublicUrl(key: string): string {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
