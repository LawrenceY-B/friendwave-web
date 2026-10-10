"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocketEvent } from "./realtime-provider";

export const NOTIFICATIONS_READ_EVENT = "friendwave:notifications-read";

// Bell with a red dot while there are unread notifications. Starts from the server's
// count, then updates live; opening the notifications page clears it.
export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  useSocketEvent("notification:new", () => setUnread((n) => n + 1));
  useEffect(() => {
    const clear = () => setUnread(0);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, clear);
    return () => window.removeEventListener(NOTIFICATIONS_READ_EVENT, clear);
  }, []);

  const label = unread > 0 ? `Notifications (${unread} unread)` : "Notifications";
  return (
    <Link
      href="/notifications"
      aria-label={label}
      title={label}
      className="relative rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span
          data-testid="unread-dot"
          className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black"
        />
      )}
    </Link>
  );
}
