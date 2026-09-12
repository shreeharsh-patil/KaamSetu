import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { io as ioClient } from 'socket.io-client';
import { app } from '../src/app.js';
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { WorkerProfileModel } from '../src/modules/worker-profiles/worker-profile.model.js';
import { JobModel } from '../src/modules/jobs/job.model.js';
import { ConversationModel } from '../src/modules/conversations/conversation.model.js';
import { MessageModel } from '../src/modules/messages/message.model.js';
import { NotificationModel } from '../src/modules/notifications/notification.model.js';
import { ServiceCategoryModel } from '../src/modules/service-categories/service-category.model.js';
import { SkillModel } from '../src/modules/skills/skill.model.js';
import { userRepository } from '../src/modules/users/user.repository.js';
import { sessionRepository } from '../src/modules/sessions/session.repository.js';
import { serviceCategoryRepository } from '../src/modules/service-categories/service-category.repository.js';
import { skillRepository } from '../src/modules/skills/skill.repository.js';
import { notificationService } from '../src/modules/notifications/notification.service.js';
import { realtimeGateway } from '../src/realtime/index.js';
import {
  UserRole,
  JobStatus,
  MessageType,
  NotificationChannel,
  NotificationType,
} from '@kaamsetu/types';
import { signAccessToken } from '../src/modules/auth/token.util.js';

const TEST_MONGODB_URI =
  process.env['MONGODB_URI'] || 'mongodb://localhost:27017/kaamsetu_test';

const PHONE_PREFIX = '+91922222';

describe('Messaging & Notifications (Phase 7)', () => {
  let customerUser: { id: string; token: string };
  let workerUser: { id: string; token: string };
  let otherUser: { id: string; token: string };
  let categoryId: string;
  let skillId: string;
  let jobId: string;
  let conversationId: string;
  let httpServer: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    await connectMongoDB({ uri: TEST_MONGODB_URI });
    await UserModel.syncIndexes();
    await SessionModel.syncIndexes();
    await WorkerProfileModel.syncIndexes();
    await JobModel.syncIndexes();
    await ConversationModel.syncIndexes();
    await MessageModel.syncIndexes();
    await NotificationModel.syncIndexes();
    await ServiceCategoryModel.syncIndexes();
    await SkillModel.syncIndexes();

    // Isolated cleanup
    await UserModel.deleteMany({ phoneNumber: /^\+91922222/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase7-/ });
    await SkillModel.deleteMany({ slug: /^phase7-/ });

    // 1. Create Category and Skill
    const cat = await serviceCategoryRepository.create({
      name: 'Phase7 Appliance Repair',
      slug: 'phase7-appliance-repair',
      active: true,
    });
    categoryId = cat.id;

    const sk = await skillRepository.create({
      name: 'Refrigerator Gas Refill',
      slug: 'phase7-fridge-refill',
      categoryId,
      active: true,
    });
    skillId = sk.id;

    // 2. Helper to create user, session, and token
    async function createUserAndToken(phoneSuffix: string, role: UserRole) {
      const u = await userRepository.create({
        phoneNumber: `${PHONE_PREFIX}${phoneSuffix}`,
        role,
      });
      const sess = await sessionRepository.create({
        userId: u.id,
        refreshTokenHash: `p7-hash-${phoneSuffix}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      const token = signAccessToken({
        userId: u.id,
        role: u.role,
        sessionId: sess.id,
        familyId: sess.familyId,
      });
      return { id: u.id, token, sessionId: sess.id };
    }

    customerUser = await createUserAndToken('0001', UserRole.CUSTOMER);
    workerUser = await createUserAndToken('0002', UserRole.WORKER);
    otherUser = await createUserAndToken('0003', UserRole.WORKER);

    // 3. Create active job with assigned worker
    const jobDoc = await JobModel.create({
      customerId: customerUser.id,
      categoryId,
      requiredSkills: [skillId],
      title: 'Refrigerator not cooling',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: { line: 'Koramangala 4th Block', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
      preferredTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: JobStatus.ACCEPTED,
      assignedWorkerId: workerUser.id,
      estimatedPrice: 700,
    });
    jobId = jobDoc._id.toString();

    // 4. Start HTTP Server & Socket.IO for integration testing
    httpServer = http.createServer(app);
    realtimeGateway.initialize(httpServer, '*');

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (typeof addr === 'object' && addr !== null) {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await realtimeGateway.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const userIds = [customerUser?.id, workerUser?.id, otherUser?.id];
    await NotificationModel.deleteMany({ userId: { $in: userIds } });
    await MessageModel.deleteMany({ senderId: { $in: userIds } });
    if (conversationId) {
      await ConversationModel.findByIdAndDelete(conversationId);
    }
    await JobModel.deleteMany({ customerId: customerUser?.id });
    await SessionModel.deleteMany({ userId: { $in: userIds } });
    await UserModel.deleteMany({ phoneNumber: /^\+91922222/ });
    await ServiceCategoryModel.deleteMany({ slug: /^phase7-/ });
    await SkillModel.deleteMany({ slug: /^phase7-/ });
    await disconnectMongoDB();
  });

  describe('Conversations (GET /api/v1/jobs/:jobId/conversation)', () => {
    it('should get or create a conversation for the job participants', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/conversation`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation.jobId).toBe(jobId);
      expect(res.body.data.conversation.participants).toContain(customerUser.id);
      expect(res.body.data.conversation.participants).toContain(workerUser.id);

      conversationId = res.body.data.conversation.id;
    });

    it('should allow the assigned worker to retrieve the same conversation', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/conversation`)
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversation.id).toBe(conversationId);
    });

    it('should forbid an unrelated user from accessing the job conversation', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/conversation`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for a nonexistent job', async () => {
      const fakeJobId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/v1/jobs/${fakeJobId}/conversation`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Conversations list (GET /api/v1/conversations)', () => {
    it('should list conversations the user participates in with resolved names', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.conversations)).toBe(true);

      const mine = res.body.data.conversations.find(
        (c: { jobId: string }) => c.jobId === jobId
      );
      expect(mine).toBeDefined();
      expect(mine.id).toBe(conversationId);
      expect(mine.jobTitle).toBe('Refrigerator not cooling');
      expect(mine.otherParticipant.id).toBe(workerUser.id);
      expect(mine.otherParticipant.name).toBeTruthy();
      expect(mine.otherParticipant.role).toBe(UserRole.WORKER);
      expect(mine).toHaveProperty('unreadCount');
      expect(mine).toHaveProperty('lastMessage');
    });

    it('should list from the worker side with the customer as other participant', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${workerUser.token}`);

      expect(res.status).toBe(200);
      const mine = res.body.data.conversations.find(
        (c: { jobId: string }) => c.jobId === jobId
      );
      expect(mine).toBeDefined();
      expect(mine.otherParticipant.id).toBe(customerUser.id);
    });

    it('should return an empty list for a user with no conversations', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversations).toEqual([]);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/conversations');
      expect(res.status).toBe(401);
    });
  });

  describe('Messages (POST & GET /api/v1/conversations/:id/messages)', () => {
    it('should allow customer to post a TEXT message', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          type: MessageType.TEXT,
          content: 'Hello, what time will you arrive?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message.content).toBe('Hello, what time will you arrive?');
      expect(res.body.data.message.type).toBe(MessageType.TEXT);
      expect(res.body.data.message.senderId).toBe(customerUser.id);
      expect(res.body.data.message.sender).toBeDefined();
      expect(res.body.data.message.sender.id).toBe(customerUser.id);
      expect(res.body.data.message.sender.role).toBe(UserRole.CUSTOMER);
      expect(res.body.data.message.sender.displayName).toBeTruthy();
      expect(res.body.data.message.readAt).toBeNull();
    });

    it('should allow worker to post an IMAGE message with attachment metadata', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${workerUser.token}`)
        .send({
          type: MessageType.IMAGE,
          content: 'Here is the replacement valve part photo',
          attachment: {
            url: 'https://cdn.kaamsetu.com/parts/valve-123.jpg',
            key: 'parts/valve-123.jpg',
            mimeType: 'image/jpeg',
            width: 800,
            height: 600,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message.type).toBe(MessageType.IMAGE);
      expect(res.body.data.message.attachment.url).toBe(
        'https://cdn.kaamsetu.com/parts/valve-123.jpg'
      );
    });

    it('should allow worker to post a LOCATION message with coordinates', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${workerUser.token}`)
        .send({
          type: MessageType.LOCATION,
          content: 'I am currently waiting at the landmark building',
          attachment: {
            coordinates: [77.5946, 12.9716],
            address: 'Sony Signal, Koramangala',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message.type).toBe(MessageType.LOCATION);
      expect(res.body.data.message.attachment.coordinates).toEqual([77.5946, 12.9716]);
    });

    it('should reject LOCATION message with missing coordinates', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${workerUser.token}`)
        .send({
          type: MessageType.LOCATION,
          content: 'I am waiting here without coordinates',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('SECURITY RULE: Should block clients from submitting SYSTEM messages', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          type: 'SYSTEM',
          content: 'Payment of Rs. 700 confirmed by bank',
        });

      // Validation schema blocks SYSTEM messages from client requests
      expect([400, 422, 403]).toContain(res.status);
    });

    it('should reject TEXT messages with empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          type: MessageType.TEXT,
          content: '   ',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject IMAGE message without key or url in attachment', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${customerUser.token}`)
        .send({
          type: MessageType.IMAGE,
          content: 'Look at this',
          attachment: { mimeType: 'image/jpeg' },
        });

      expect([400, 422]).toContain(res.status);
    });

    it('should forbid an unrelated user from posting messages in the conversation', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send({
          type: MessageType.TEXT,
          content: 'Intruder message',
        });

      expect(res.status).toBe(403);
    });

    it('should list messages with cursor-based pagination', async () => {
      const res = await request(app)
        .get(`/api/v1/conversations/${conversationId}/messages?limit=2`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages.length).toBe(2);
      expect(res.body.data.hasMore).toBe(true);
      expect(res.body.data.nextCursor).toBeTruthy();

      // Fetch next page using cursor
      const nextRes = await request(app)
        .get(`/api/v1/conversations/${conversationId}/messages?cursor=${res.body.data.nextCursor}&limit=2`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(nextRes.status).toBe(200);
      expect(nextRes.body.data.messages.length).toBeGreaterThanOrEqual(1);

      // Verify no duplicates between pages
      const page1Ids = res.body.data.messages.map((m: any) => m.id);
      const page2Ids = nextRes.body.data.messages.map((m: any) => m.id);
      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });

    it('POST /api/v1/conversations/:id/read — marks other participants messages as read', async () => {
      const res = await request(app)
        .post(`/api/v1/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify messages from workerUser now have readAt set
      const messages = await MessageModel.find({
        conversationId,
        senderId: workerUser.id,
      });
      expect(messages.length).toBeGreaterThan(0);
      for (const msg of messages) {
        expect(msg.readAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Notification Service & Endpoints', () => {
    let createdNotificationId: string;

    it('should support notification creation across IN_APP, PUSH, SMS, and EMAIL channels', async () => {
      // 1. IN_APP
      const inAppNotif = await notificationService.sendNotification({
        userId: customerUser.id,
        type: NotificationType.JOB_STATUS,
        channel: NotificationChannel.IN_APP,
        title: 'Worker en route',
        body: 'Your service professional is on the way',
        data: { jobId },
      });
      expect(inAppNotif.channel).toBe(NotificationChannel.IN_APP);
      expect(inAppNotif.deliveredAt).toBeDefined();
      createdNotificationId = inAppNotif.id;

      // 2. PUSH
      const pushNotif = await notificationService.sendNotification({
        userId: customerUser.id,
        type: NotificationType.JOB_OFFER,
        channel: NotificationChannel.PUSH,
        title: 'New offer received',
        body: 'A skilled electrician sent you an estimate',
        data: { jobId },
      });
      expect(pushNotif.channel).toBe(NotificationChannel.PUSH);

      // 3. SMS
      const smsNotif = await notificationService.sendNotification({
        userId: workerUser.id,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.SMS,
        title: 'KaamSetu Alert',
        body: 'Your OTP is 123456',
      });
      expect(smsNotif.channel).toBe(NotificationChannel.SMS);

      // 4. EMAIL
      const emailNotif = await notificationService.sendNotification({
        userId: customerUser.id,
        type: NotificationType.JOB_COMPLETED,
        channel: NotificationChannel.EMAIL,
        title: 'Service Completed Receipt',
        body: 'Here is your invoice for Rs. 700',
        data: { jobId, amount: 700 },
      });
      expect(emailNotif.channel).toBe(NotificationChannel.EMAIL);
    });

    it('GET /api/v1/notifications — returns user notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.notifications.some((n: any) => n.id === createdNotificationId)).toBe(true);
    });

    it('PATCH /api/v1/notifications/:id/read — marks a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.readAt).toBeTruthy();
    });

    it('POST /api/v1/notifications/read-all — marks all user notifications as read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.markedCount).toBeGreaterThanOrEqual(1);

      // Verify all are read
      const unread = await NotificationModel.countDocuments({
        userId: customerUser.id,
        readAt: null,
      });
      expect(unread).toBe(0);
    });
  });

  describe('Realtime Messaging & Notification Socket Events', () => {
    let socketUrl: string;

    beforeAll(() => {
      socketUrl = `http://localhost:${serverPort}`;
    });

    it('should join conversation room and receive message.created event in realtime', async () => {
      const customerSocket = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });
      const workerSocket = ioClient(socketUrl, {
        auth: { token: workerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      await new Promise<void>((resolve) => {
        customerSocket.on('connect', () => resolve());
        customerSocket.connect();
      });
      await new Promise<void>((resolve) => {
        workerSocket.on('connect', () => resolve());
        workerSocket.connect();
      });

      // Customer joins conversation room
      const joinAck: any = await new Promise((resolve) => {
        customerSocket.emit('join:conversation', { conversationId }, resolve);
      });
      expect(joinAck.success).toBe(true);

      // Customer listens for new message
      const msgPromise = new Promise<any>((resolve) => {
        customerSocket.on('message.created', (payload) => {
          resolve(payload);
        });
      });

      // Worker posts a message via HTTP
      await request(app)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${workerUser.token}`)
        .send({
          type: MessageType.TEXT,
          content: 'Realtime socket test message from worker',
        });

      const received = await msgPromise;
      expect(received.conversationId).toBe(conversationId);
      expect(received.message.content).toBe('Realtime socket test message from worker');
      expect(received.message.senderId).toBe(workerUser.id);

      customerSocket.disconnect();
      workerSocket.disconnect();
    });

    it('should receive in-app notification.created on personal user room', async () => {
      const customerSocket = ioClient(socketUrl, {
        auth: { token: customerUser.token },
        autoConnect: false,
        reconnection: false,
      });

      await new Promise<void>((resolve) => {
        customerSocket.on('connect', () => resolve());
        customerSocket.connect();
      });

      const notifPromise = new Promise<any>((resolve) => {
        customerSocket.on('notification.created', (payload) => {
          resolve(payload);
        });
      });

      // Dispatch notification
      await notificationService.sendNotification({
        userId: customerUser.id,
        type: NotificationType.JOB_ACCEPTED,
        channel: NotificationChannel.IN_APP,
        title: 'Job Accepted!',
        body: 'Plumber accepted your job request',
        data: { jobId },
      });

      const received = await notifPromise;
      expect(received.userId).toBe(customerUser.id);
      expect(received.title).toBe('Job Accepted!');
      expect(received.channel).toBe(NotificationChannel.IN_APP);

      customerSocket.disconnect();
    });
  });
});
