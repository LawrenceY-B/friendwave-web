"use client";

import { setFollowing } from "@/lib/actions";
import { useOptimistic, useTransition } from "react";

// The action revalidates the profile, so the follower count on the page updates too
export function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const [following, setOptimistic] = useOptimistic(isFollowing);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!following);
      await setFollowing(userId, !following);
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
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
