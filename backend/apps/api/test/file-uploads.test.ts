import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { UploadModel } from '../src/modules/uploads/upload.model.js';
import { mockStorageProvider } from '../src/modules/uploads/providers/mock-storage.provider.js';
import {
  UserRole,
  UserStatus,
  UploadPurpose,
  UploadStatus,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91971234';

describe('Secure File Upload & Storage Layer (Phase 10)', () => {
  let user1: { id: string; token: string };
  let user2: { id: string; token: string };
  let adminUser: { id: string; token: string };
  let supportUser: { id: string; token: string };

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await UploadModel.syncIndexes();

    await UserModel.deleteMany({ phoneNumber: /^\+91971234/ });

    async function createUser(phoneSuffix: string, role: UserRole) {
      const u = await UserModel.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
        phoneVerified: true,
        status: UserStatus.ACTIVE,
      });
      const sess = await sessionRepository.create({
        userId: u._id.toString(),
        refreshTokenHash: `p10-hash-${phoneSuffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const token = signAccessToken({
        userId: u._id.toString(),
        role: u.role,
        sessionId: sess.id,
        familyId: sess.familyId,
      });
      return { id: u._id.toString(), token };
    }

    user1 = await createUser('0001', UserRole.WORKER);
    user2 = await createUser('0002', UserRole.CUSTOMER);
    adminUser = await createUser('0003', UserRole.ADMIN);
    supportUser = await createUser('0004', UserRole.SUPPORT);
  });

  afterAll(async () => {
    await UserModel.deleteMany({ phoneNumber: /^\+91971234/ });
    await UploadModel.deleteMany({ userId: { $in: [user1.id, user2.id, adminUser.id, supportUser.id] } });
    await disconnectMongoDB();
  });

  beforeEach(() => {
    mockStorageProvider.clear();
  });

  // =============================================================
  // 1. Core Upload Flow: Presign -> Direct Upload -> Complete -> Metadata
  // =============================================================
  describe('1. Core Upload Flow', () => {
    it('generates presigned upload URL with random key and stores pending record', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'my_avatar.png',
          mimeType: 'image/png',
          sizeBytes: 250000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadId).toBeTruthy();
      expect(res.body.data.uploadUrl).toContain('https://storage.kaamsetu.test/upload/');
      expect(res.body.data.expiresInSeconds).toBe(900);
      expect(res.body.data.requiredHeaders).toEqual({ 'content-type': 'image/png' });

      // NEVER trust user filename — key must contain purpose and random identifier
      const key = res.body.data.key;
      expect(key).toMatch(/^uploads\/profile_photo\//);
      expect(key).not.toContain('my_avatar.png');
      expect(key).toMatch(/\.png$/);

      // Verify pending record in database
      const record = await UploadModel.findById(res.body.data.uploadId);
      expect(record).toBeTruthy();
      expect(record?.status).toBe(UploadStatus.PENDING);
      expect(record?.isPublic).toBe(true);
      expect(record?.originalFilename).toBe('my_avatar.png');
    });

    it('confirms upload, verifies object in storage, and marks completed with public URL for public assets', async () => {
      // 1. Presign
      const presignRes = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.WORKER_PORTFOLIO,
          filename: 'finished_work.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1500000,
        });
      const uploadId = presignRes.body.data.uploadId;

      // 2. Complete
      const completeRes = await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ uploadId });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.status).toBe(UploadStatus.COMPLETED);
      expect(completeRes.body.data.isPublic).toBe(true);
      expect(completeRes.body.data.publicUrl).toContain('https://cdn.kaamsetu.test/');

      // Database verification
      const record = await UploadModel.findById(uploadId);
      expect(record?.status).toBe(UploadStatus.COMPLETED);
      expect(record?.publicUrl).toBeTruthy();

      // Idempotency: second complete call succeeds without duplicate side-effects
      const repeatRes = await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ uploadId });
      expect(repeatRes.status).toBe(200);
      expect(repeatRes.body.data.status).toBe(UploadStatus.COMPLETED);
    });

    it('deletes uploaded file from storage and database', async () => {
      const presignRes = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.JOB_IMAGE,
          filename: 'broken_sink.webp',
          mimeType: 'image/webp',
          sizeBytes: 400000,
        });
      const uploadId = presignRes.body.data.uploadId;

      await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ uploadId });

      // Delete file
      const delRes = await request(app)
        .delete(`/api/v1/uploads/${uploadId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deletion in DB
      const record = await UploadModel.findById(uploadId);
      expect(record).toBeNull();

      // Verify 404 on subsequent get
      const getRes = await request(app)
        .get(`/api/v1/uploads/${uploadId}`)
        .set('Authorization', `Bearer ${user1.token}`);
      expect(getRes.status).toBe(404);
    });
  });

  // =============================================================
  // 2. Strict Validation: MIME Types, Extensions, Sizes & Purpose
  // =============================================================
  describe('2. Strict Validation Guardrails', () => {
    it('rejects disallowed MIME type with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'script.sh',
          mimeType: 'application/x-sh',
          sizeBytes: 1024,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid MIME type');
    });

    it('rejects PDF for PROFILE_PHOTO (images only)', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'avatar.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 50000,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid MIME type');
    });

    it('rejects filename extension mismatch with MIME type', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'malicious.php',
          mimeType: 'image/jpeg',
          sizeBytes: 20000,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid file extension');
    });

    it('rejects file size exceeding purpose maximum limit', async () => {
      // PROFILE_PHOTO max is 5MB
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'giant_image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 6 * 1024 * 1024, // 6MB > 5MB limit
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds maximum allowable size');
    });

    it('allows larger files up to 15MB for VERIFICATION_DOCUMENT', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.VERIFICATION_DOCUMENT,
          filename: 'government_id.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12 * 1024 * 1024, // 12MB < 15MB limit
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =============================================================
  // 3. Privacy & Signed Download URLs (Verification & Receipts)
  // =============================================================
  describe('3. Privacy & Signed Download URLs for Sensitive Documents', () => {
    let verificationUploadId: string;

    beforeAll(async () => {
      const presign = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.VERIFICATION_DOCUMENT,
          filename: 'aadhaar_card.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1000000,
        });
      verificationUploadId = presign.body.data.uploadId;

      await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ uploadId: verificationUploadId });
    });

    it('STRICT PRIVACY: does not expose private verification documents publicly', async () => {
      const record = await UploadModel.findById(verificationUploadId);
      expect(record?.isPublic).toBe(false);
      expect(record?.publicUrl).toBeNull();

      const getRes = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.isPublic).toBe(false);
      expect(getRes.body.data.publicUrl).toBeNull();
    });

    it('generates secure signed download URL for the document owner', async () => {
      const res = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}/download-url`)
        .set('Authorization', `Bearer ${user1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toContain('https://storage.kaamsetu.test/download/');
      expect(res.body.data.expiresInSeconds).toBe(900);
    });

    it('allows ADMIN and SUPPORT to obtain signed download URL for verification review', async () => {
      // Admin access
      const resAdmin = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}/download-url`)
        .set('Authorization', `Bearer ${adminUser.token}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.downloadUrl).toBeTruthy();

      // Support access
      const resSupport = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}/download-url`)
        .set('Authorization', `Bearer ${supportUser.token}`);
      expect(resSupport.status).toBe(200);
      expect(resSupport.body.data.downloadUrl).toBeTruthy();
    });

    it('STRICT ACCESS CONTROL: blocks other unrelated users from downloading private documents with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}/download-url`)
        .set('Authorization', `Bearer ${user2.token}`); // user2 is unrelated customer

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('permission');
    });

    it('STRICT ACCESS CONTROL: blocks other unrelated users from inspecting private document record with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/uploads/${verificationUploadId}`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect(res.status).toBe(403);
    });
  });

  // =============================================================
  // 4. Ownership & Cross-User Security
  // =============================================================
  describe('4. Ownership & Cross-User Security', () => {
    let user1UploadId: string;

    beforeAll(async () => {
      const presign = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.JOB_IMAGE,
          filename: 'kitchen.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 500000,
        });
      user1UploadId = presign.body.data.uploadId;
    });

    it('blocks user2 from completing user1 upload with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user2.token}`)
        .send({ uploadId: user1UploadId });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('only complete your own uploads');
    });

    it('blocks user2 from deleting user1 upload with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/uploads/${user1UploadId}`)
        .set('Authorization', `Bearer ${user2.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('only delete your own uploads');
    });

    it('allows ADMIN to delete any user upload', async () => {
      const res = await request(app)
        .delete(`/api/v1/uploads/${user1UploadId}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =============================================================
  // 5. Verification Failure When File Not in Storage
  // =============================================================
  describe('5. Storage Consistency Verification', () => {
    it('fails complete upload with 400 Bad Request when file has not actually landed in object storage', async () => {
      mockStorageProvider.setAutoSimulateUpload(false); // Do not place object in mock storage

      const presignRes = await request(app)
        .post('/api/v1/uploads/presign')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({
          purpose: UploadPurpose.PROFILE_PHOTO,
          filename: 'ghost_upload.png',
          mimeType: 'image/png',
          sizeBytes: 100000,
        });

      const res = await request(app)
        .post('/api/v1/uploads/complete')
        .set('Authorization', `Bearer ${user1.token}`)
        .send({ uploadId: presignRes.body.data.uploadId });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('File has not been uploaded to object storage yet');
    });
  });
});
