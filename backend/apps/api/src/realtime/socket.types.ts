import type {
  SocketUserPayload,
  WorkerLocationUpdatePayload,
  WorkerLocationUpdatedPayload,
  JobStatusChangedPayload,
  JobOfferCreatedPayload,
  JobAcceptedPayload,
  JobCompletedPayload,
  NewMessageSocketPayload,
  MessageReadSocketPayload,
  INotificationEntity,
} from '@kaamsetu/types';

export interface ClientToServerEvents {
  'join:job': (
    data: { jobId: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'leave:job': (
    data: { jobId: string },
    callback?: (response: { success: boolean }) => void
  ) => void;
  'join:conversation': (
    data: { conversationId: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  'leave:conversation': (
    data: { conversationId: string },
    callback?: (response: { success: boolean }) => void
  ) => void;
  'worker.location.update': (
    data: WorkerLocationUpdatePayload,
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  'job.offer.created': (data: JobOfferCreatedPayload) => void;
  'job.accepted': (data: JobAcceptedPayload) => void;
  'job.status.changed': (data: JobStatusChangedPayload) => void;
  'worker.location.updated': (data: WorkerLocationUpdatedPayload) => void;
  'job.completed': (data: JobCompletedPayload) => void;
  'message.created': (data: NewMessageSocketPayload) => void;
  'message.read': (data: MessageReadSocketPayload) => void;
  'notification.created': (data: INotificationEntity) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: SocketUserPayload;
}
