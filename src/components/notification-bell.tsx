"use client";

import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSocketEvent } from "./realtime-provider";

export const NOTIFICATIONS_READ_EVENT = "friendwave:notifications-read";

// Bell with a red dot while there are unread notifications. Starts from the server's
// count, then updates live; opening the notifications page clears it.
export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const bell = useRef<SVGSVGElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const previous = useRef(initialUnread);
  useSocketEvent("notification:new", () => setUnread((n) => n + 1));

  // Something new: the bell swings from the top, then the dot pops
  useGSAP(
    () => {
      const was = previous.current;
      previous.current = unread;
      if (unread <= was || reducedMotion()) return;
      gsap
        .timeline()
        .to(bell.current, {
          keyframes: { rotation: [0, 28, -24, 18, -12, 7, -3, 0] },
          duration: 0.9,
          ease: "power1.inOut",
          transformOrigin: "50% 8%",
        })
        .fromTo(dot.current, { scale: 0 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.4, 0.35)" }, 0.1);
    },
    { dependencies: [unread] }
  );

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
      <Bell ref={bell} className="size-5" />
      {unread > 0 && (
        <span
          ref={dot}
          data-testid="unread-dot"
          className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black"
        />
      )}
    </Link>
  );
}
