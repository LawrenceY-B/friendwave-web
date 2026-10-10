"use client";

import type { Notification } from "@/interfaces/api";
import { loadNotifications, markNotificationsRead } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
export function NotificationList({
  initial,
  nextCursor: initialCursor,
}: {
  initial: Notification[];
  nextCursor: string | null;
}) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [expanded, setExpanded] = useState(false); // "See all" pressed at least once
  const [loading, startLoading] = useTransition();
  useSocketEvent<Notification>("notification:new", (n) =>
    setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]))
  );

  useEffect(() => {
    window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    markNotificationsRead().catch(() => {});
  }, []);

  // The next 10, older than the last one shown
  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const page = await loadNotifications(cursor);
      setItems((prev) => [...prev, ...page.items.filter((n) => !prev.some((x) => x.id === n.id))]);
      setCursor(page.nextCursor);
      setExpanded(true);
    });

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-neutral-500">No notifications yet.</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="-mx-3">
        {items.map((n) => {
          // A post notification opens the post (on top of this page); a follow opens their profile
          const href = n.post ? `/posts/${n.post.id}` : n.actor ? `/users/${n.actor.id}` : "#";
          return (
            <li key={n.id} data-reveal data-unread={!n.read || undefined}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <Avatar user={n.actor} />
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold">{n.actor?.username ?? "Someone"}</span> {TEXT[n.type]}{" "}
                  <time suppressHydrationWarning dateTime={n.createdAt} className="text-neutral-500">
                    {timeAgo(n.createdAt)}
                  </time>
                </p>
                {!n.read && <span aria-label="New" className="size-2 shrink-0 rounded-full bg-blue-500" />}
                {n.post?.imageUrl && (
                  <Image
                    src={n.post.imageUrl}
                    alt=""
                    width={44}
                    height={44}
                    unoptimized
                    className="size-11 shrink-0 rounded-md object-cover"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-lg py-2 text-sm font-semibold text-blue-600 hover:bg-neutral-100 disabled:opacity-60 dark:hover:bg-neutral-900"
        >
          {loading ? "Loading…" : expanded ? "See more" : "See all"}
        </button>
      )}
    </div>
  );
}
