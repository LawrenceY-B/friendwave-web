import { NotificationList } from "@/components/notification-list";
import { PageTitle } from "@/components/page-title";
import type { Notification } from "@/interfaces/api";
import { apiPage } from "@/lib/api";
import { NOTIFICATIONS_PAGE } from "@/lib/limits";
import { Suspense } from "react";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <PageTitle title="Notifications" back />
      <h1 className="hidden text-xl font-semibold sm:block">Notifications</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-900" />}>
        <Notifications />
      </Suspense>
    </div>
  );
}

async function Notifications() {
  const { items, nextCursor } = await apiPage<Notification>(`/api/notifications?limit=${NOTIFICATIONS_PAGE}`);
  return <NotificationList initial={items} nextCursor={nextCursor} />;
}
