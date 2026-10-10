"use client";

import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSocketEvent } from "./realtime-provider";

// "↑ New posts" when someone you follow posts while you're on the feed.
// Tapping it reloads the feed (server) and scrolls to the top.
export function NewPostsPill() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pending, startTransition] = useTransition();
  useSocketEvent("feed:new-post", () => setCount((n) => n + 1));

  if (count === 0) return null;
  return (
    <div className="sticky top-16 z-20 flex justify-center">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            router.refresh();
            window.scrollTo({ top: 0, behavior: "smooth" });
            setCount(0);
          })
        }
        className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        <ArrowUp className="size-4" />
        New posts
      </button>
    </div>
  );
}
