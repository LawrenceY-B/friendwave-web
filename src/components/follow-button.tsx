"use client";

import { setFollowing } from "@/lib/actions";
import { useOptimistic, useState, useTransition } from "react";

// Flips instantly (optimistic), then keeps what the server confirmed. Keeping the
// confirmed value locally matters on pages the action doesn't re-render (e.g. search
// results): useOptimistic alone falls back to the original prop once the request ends.
export function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const [confirmed, setConfirmed] = useState(isFollowing);
  const [following, setOptimistic] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!following);
      const result = await setFollowing(userId, !following);
      setConfirmed(result.following);
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={
        following
          ? "rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium dark:border-neutral-700"
          : "rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
