import { NotificationList } from "@/components/notification-list";
import type { Notification } from "@/interfaces/api";
import { apiPage } from "@/lib/api";
import { Suspense } from "react";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-900" />}>
        <Notifications />
      </Suspense>
    </div>
  );
}

async function Notifications() {
  const { items } = await apiPage<Notification>("/api/notifications?limit=50");
  return <NotificationList initial={items} />;
}
