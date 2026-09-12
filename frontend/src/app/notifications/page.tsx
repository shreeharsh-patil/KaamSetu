"use client";

import { Container } from "@/components/layout/container";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function NotificationsPage() {
  return (
    <Container className="py-6 max-w-2xl space-y-4">
      <NotificationCenter />
    </Container>
  );
}
