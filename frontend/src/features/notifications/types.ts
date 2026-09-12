export type NotificationType =
  | "JOB_OFFER"
  | "JOB_STATUS"
  | "MESSAGE"
  | "NEW_MESSAGE"
  | "PAYMENT"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}
