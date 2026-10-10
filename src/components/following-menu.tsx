"use client";

import { setFollowing } from "@/lib/actions";
import { ChevronDown, ChevronRight, CircleStar, Star } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Sheet, SheetItem } from "./sheet";

const buttonBase = "flex w-full items-center justify-center gap-1 rounded-lg px-4 py-1.5 text-sm font-semibold";

// Profile button: "Follow" (blue) or "Following ▾", which opens a sheet with
// Unfollow (and options that aren't built yet, marked "Coming soon").
export function FollowingMenu({
  userId,
  username,
  isFollowing,
}: {
  userId: string;
  username: string;
  isFollowing: boolean;
}) {
  const [confirmed, setConfirmed] = useState(isFollowing);
  const [following, setOptimistic] = useOptimistic(confirmed);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const change = (next: boolean) =>
    startTransition(async () => {
      setOptimistic(next);
      setOpen(false);
      setConfirmed((await setFollowing(userId, next)).following);
    });

  if (!following) {
    return (
      <button
        type="button"
        onClick={() => change(true)}
        disabled={pending}
        className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-700`}
      >
        Follow
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-haspopup="dialog"
        className={`${buttonBase} bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700`}
      >
        Following <ChevronDown className="size-4" aria-hidden />
      </button>
      <Sheet title={username} open={open} onClose={() => setOpen(false)}>
        <SheetItem label="Add to Close Friends list" icon={CircleStar} comingSoon />
        <SheetItem label="Add to Favourites" icon={Star} comingSoon />
        <SheetItem label="Mute" icon={ChevronRight} comingSoon />
        <SheetItem label="Restrict" icon={ChevronRight} comingSoon />
        <SheetItem label="Unfollow" onClick={() => change(false)} disabled={pending} />
      </Sheet>
    </>
  );
}
