"use client";

import { plural } from "@/lib/format";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePostLive } from "./post-live";

// Heart + count. State lives in <PostLiveProvider> (shared with double tap on the photo,
// and kept live from other people's likes).
export function LikeButton() {
  const { liked, likeCount, setLike } = usePostLive();
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <button type="button" onClick={() => setLike(!liked)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"}>
        <Heart className={liked ? "size-6 fill-red-500 text-red-500" : "size-6"} />
      </button>
      {/* Just the number on screen; screen readers hear "3 likes" */}
      <span data-testid="like-count">
        {likeCount.toLocaleString("en")}
        <span className="sr-only">{plural(likeCount, "like").replace(/^[\d,]+/, "")}</span>
      </span>
    </span>
  );
}

// Comment icon + live count; opens the post (overlay) with its comments
export function CommentCountLink({ postId }: { postId: string }) {
  const { commentCount } = usePostLive();
  return (
    <Link
      href={`/posts/${postId}`}
      aria-label={`${plural(commentCount, "comment")}, open comments`}
      className="flex items-center gap-1.5 text-sm hover:opacity-70"
    >
      <MessageCircle className="size-6" />
      <span data-testid="comment-count">{commentCount.toLocaleString("en")}</span>
    </Link>
  );
}
