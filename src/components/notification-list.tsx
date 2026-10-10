"use client";

import type { Notification } from "@/interfaces/api";
import { markNotificationsRead } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "./avatar";
import { NOTIFICATIONS_READ_EVENT } from "./notification-bell";
import { useSocketEvent } from "./realtime-provider";

const TEXT: Record<Notification["type"], string> = {
  follow: "started following you.",
  like: "liked your post.",
  comment: "commented on your post.",
  reply: "replied to your comment.",
  story_share: "shared your post to their story.",
};

// Your notifications; new ones appear at the top while you're here. Opening this
// marks everything read (and clears the bell's red dot).
export function NotificationList({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  useSocketEvent<Notification>("notification:new", (n) =>
    setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]))
  );

  useEffect(() => {
    window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    markNotificationsRead().catch(() => {});
  }, []);

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-neutral-500">No notifications yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
      {items.map((n) => {
        // A post notification opens the post (on top of this page); a follow opens their profile
        const href = n.post ? `/posts/${n.post.id}` : n.actor ? `/users/${n.actor.id}` : "#";
        return (
          <li
            key={n.id}
            data-unread={!n.read || undefined}
            className="data-unread:bg-blue-50 dark:data-unread:bg-blue-950/30"
          >
            <Link href={href} className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <Avatar user={n.actor} />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{n.actor?.username ?? "Someone"}</span> {TEXT[n.type]}{" "}
                <time dateTime={n.createdAt} className="text-neutral-500">
                  {timeAgo(n.createdAt)}
                </time>
              </p>
              {n.post?.imageUrl && (
                <Image
                  src={n.post.imageUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="size-11 shrink-0 rounded object-cover"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
