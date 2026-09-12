import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { UserRole } from '@kaamsetu/types';
import { workerLocationSocketSchema } from '@kaamsetu/validation';
import { logger } from '../config/index.js';
import { jobRepository, IJobRepository } from '../modules/jobs/job.repository.js';
import { createSocketAuthMiddleware } from './socket.auth.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './socket.types.js';

export class RealtimeGateway {
  private io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;

  constructor(private readonly jobRepo: IJobRepository = jobRepository) {}

  /**
   * Initializes the Socket.IO server on top of an existing HTTP server.
   */
  initialize(
    httpServer: HttpServer,
    corsOrigin: string | string[] = '*'
  ): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    if (this.io) {
      return this.io;
    }

    this.io = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Register token authentication middleware
    this.io.use(createSocketAuthMiddleware());

    // Register connection handlers
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      logger.info(
        { socketId: socket.id, userId: user.userId, role: user.role },
        'Client connected to realtime socket gateway'
      );

      // 1. Automatically join personal user room for direct notifications
      const userRoom = `user:${user.userId}`;
      socket.join(userRoom);

      // 2. Room membership handler for specific jobs
      socket.on('join:job', async (data, callback) => {
        try {
          const { jobId } = data;
          if (!jobId) {
            callback?.({ success: false, error: 'jobId is required' });
            return;
          }

          const job = await this.jobRepo.findById(jobId);
          if (!job) {
            callback?.({ success: false, error: 'Job not found' });
            return;
          }

          // Access control: only customer, assigned worker, or admin can join the job room
          const isCustomer = job.customerId === user.userId;
          const isAssignedWorker = job.assignedWorkerId === user.userId;
          const isAdmin = user.role === UserRole.ADMIN;

          if (!isCustomer && !isAssignedWorker && !isAdmin) {
            logger.warn(
              { socketId: socket.id, userId: user.userId, jobId },
              'Denied socket room join: unauthorized user'
            );
            callback?.({
              success: false,
              error: 'Unauthorized to join this job room',
            });
            return;
          }

          const jobRoom = `job:${jobId}`;
          socket.join(jobRoom);
          logger.debug({ socketId: socket.id, userId: user.userId, jobRoom }, 'Joined job room');
          callback?.({ success: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to join job room';
          logger.error({ socketId: socket.id, err: message }, 'Error in join:job handler');
          callback?.({ success: false, error: message });
        }
      });

      socket.on('leave:job', (data, callback) => {
        if (data?.jobId) {
          socket.leave(`job:${data.jobId}`);
        }
        callback?.({ success: true });
      });

      // Room membership handlers for conversations
      socket.on('join:conversation', async (data, callback) => {
        try {
          const { conversationId } = data;
          if (!conversationId) {
            callback?.({ success: false, error: 'conversationId is required' });
            return;
          }

          const { conversationRepository } = await import('../modules/conversations/conversation.repository.js');
          const conv = await conversationRepository.findById(conversationId);
          if (!conv) {
            callback?.({ success: false, error: 'Conversation not found' });
            return;
          }

          const isParticipant = conv.participants.includes(user.userId);
          const isAdmin = user.role === UserRole.ADMIN;

          if (!isParticipant && !isAdmin) {
            callback?.({ success: false, error: 'Unauthorized to join this conversation' });
            return;
          }

          const room = `conversation:${conversationId}`;
          socket.join(room);
          callback?.({ success: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to join conversation';
          callback?.({ success: false, error: msg });
        }
      });

      socket.on('leave:conversation', (data, callback) => {
        if (data?.conversationId) {
          socket.leave(`conversation:${data.conversationId}`);
        }
        callback?.({ success: true });
      });

      // 3. Worker realtime location streaming during travel / job execution
      socket.on('worker.location.update', async (data, callback) => {
        try {
          const parsed = workerLocationSocketSchema.safeParse(data);
          if (!parsed.success) {
            callback?.({ success: false, error: 'Invalid location update payload' });
            return;
          }

          if (user.role !== UserRole.WORKER) {
            callback?.({ success: false, error: 'Only workers can stream location updates' });
            return;
          }

          const { jobId, coordinates } = parsed.data;
          const job = await this.jobRepo.findById(jobId);
          if (!job) {
            callback?.({ success: false, error: 'Job not found' });
            return;
          }

          if (job.assignedWorkerId !== user.userId) {
            callback?.({
              success: false,
              error: 'Only the assigned worker can stream location for this job',
            });
            return;
          }

          // Broadcast location update to customer and all listeners in the job room
          const jobRoom = `job:${jobId}`;
          this.io?.to(jobRoom).emit('worker.location.updated', {
            jobId,
            workerId: user.userId,
            coordinates: coordinates as [number, number],
            updatedAt: new Date().toISOString(),
          });

          callback?.({ success: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to update location';
          logger.error({ socketId: socket.id, err: message }, 'Error in worker.location.update');
          callback?.({ success: false, error: message });
        }
      });

      socket.on('disconnect', (reason) => {
        logger.info(
          { socketId: socket.id, userId: user.userId, reason },
          'Client disconnected from realtime socket gateway'
        );
      });
    });

    return this.io;
  }

  /**
   * Emits a typed event to all connected sockets belonging to a specific user.
   */
  emitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): boolean {
    if (!this.io) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.io.to(`user:${userId}`) as any).emit(event, data);
    return true;
  }

  /**
   * Emits a typed event to all connected sockets in a specific job room.
   */
  emitToJob<K extends keyof ServerToClientEvents>(
    jobId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): boolean {
    if (!this.io) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.io.to(`job:${jobId}`) as any).emit(event, data);
    return true;
  }

  /**
   * Emits a typed event to all connected sockets in a specific conversation room.
   */
  emitToConversation<K extends keyof ServerToClientEvents>(
    conversationId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): boolean {
    if (!this.io) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.io.to(`conversation:${conversationId}`) as any).emit(event, data);
    return true;
  }

  /**
   * Broadcasts a typed event to all connected clients on the gateway.
   */
  broadcast<K extends keyof ServerToClientEvents>(
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): boolean {
    if (!this.io) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.io as any).emit(event, data);
    return true;
  }

  /**
   * Closes the Socket.IO instance and releases resources.
   */
  async close(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => {
        this.io?.close(() => {
          resolve();
        });
      });
      this.io = null;
    }
  }

  getIO(): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null {
    return this.io;
  }
}

export const realtimeGateway = new RealtimeGateway();
