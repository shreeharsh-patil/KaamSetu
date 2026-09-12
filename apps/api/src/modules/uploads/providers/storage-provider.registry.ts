import type { IStorageProvider } from '@kaamsetu/types';
import { mockStorageProvider, MockStorageProvider } from './mock-storage.provider.js';
import { S3StorageProvider } from './s3-storage.provider.js';
import { env } from '../../../config/index.js';

export class StorageProviderRegistry {
  private activeProvider: IStorageProvider;

  constructor() {
    if (env.STORAGE_PROVIDER === 's3' && env.S3_BUCKET) {
      this.activeProvider = new S3StorageProvider({
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        cdnBaseUrl: env.CDN_BASE_URL,
      });
    } else {
      this.activeProvider = mockStorageProvider;
    }
  }

  getProvider(): IStorageProvider {
    return this.activeProvider;
  }

  setProvider(provider: IStorageProvider): void {
    this.activeProvider = provider;
  }

  resetToDefault(): void {
    if (env.STORAGE_PROVIDER === 's3' && env.S3_BUCKET) {
      this.activeProvider = new S3StorageProvider({
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        cdnBaseUrl: env.CDN_BASE_URL,
      });
    } else {
      this.activeProvider = mockStorageProvider;
    }
  }

  getMockProvider(): MockStorageProvider {
    return mockStorageProvider;
  }
}

export const storageProviderRegistry = new StorageProviderRegistry();
