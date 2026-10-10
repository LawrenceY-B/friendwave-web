"use client";

import { setLiked } from "@/lib/actions";
import { plural } from "@/lib/format";
import { Heart } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

interface LikeState {
  liked: boolean;
  likeCount: number;
}

// Updates instantly (optimistic), then settles on what the API returns.
// If the request fails, the optimistic state is dropped and the old one shows again.
export function LikeButton({ postId, initial }: { postId: string; initial: LikeState }) {
  const [state, setState] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(state);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const liked = !optimistic.liked;
    startTransition(async () => {
      setOptimistic({ liked, likeCount: optimistic.likeCount + (liked ? 1 : -1) });
      setState(await setLiked(postId, liked));
    });
  };

  return (
    <span className="flex items-center gap-1.5 text-sm">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimistic.liked}
        aria-label={optimistic.liked ? "Unlike" : "Like"}
      >
        <Heart className={optimistic.liked ? "size-6 fill-red-500 text-red-500" : "size-6"} />
      </button>
      {/* Just the number on screen; screen readers hear "3 likes" */}
      <span data-testid="like-count">
        {optimistic.likeCount.toLocaleString("en")}
        <span className="sr-only">{plural(optimistic.likeCount, "like").replace(/^[\d,]+/, "")}</span>
      </span>
    </span>
  );
}
