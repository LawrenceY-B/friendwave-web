"use client";

import { setFollowing } from "@/lib/actions";
import { gsap, reducedMotion } from "@/lib/motion";
import { useOptimistic, useRef, useState, useTransition } from "react";

// Flips instantly (optimistic), then keeps what the server confirmed. Keeping the
// confirmed value locally matters on pages the action doesn't re-render (e.g. search
// results): useOptimistic alone falls back to the original prop once the request ends.
export function FollowButton({
  userId,
  isFollowing,
  refresh = true,
  onChange,
}: {
  userId: string;
  isFollowing: boolean;
  refresh?: boolean; // false: don't re-render the page (see setFollowing)
  onChange?: (following: boolean) => void;
}) {
  const [confirmed, setConfirmed] = useState(isFollowing);
  const [following, setOptimistic] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();
  const button = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    // A squish, then a springy pop into the new state
    if (!reducedMotion())
      gsap
        .timeline()
        .to(button.current, { scale: 0.88, duration: 0.1, ease: "power2.out" })
        .to(button.current, { scale: 1, duration: 0.6, ease: "elastic.out(1.3, 0.4)" });
    startTransition(async () => {
      setOptimistic(!following);
      const result = await setFollowing(userId, !following, { refresh });
      setConfirmed(result.following);
      onChange?.(result.following);
    });
  };

  return (
    <button
      ref={button}
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={
        following
          ? "rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium transition-colors duration-300 dark:border-neutral-700"
          : "rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-blue-700"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
