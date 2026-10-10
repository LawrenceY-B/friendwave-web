"use client";

import { plural } from "@/lib/format";
import { miniBurst } from "@/lib/like-burst";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { usePostLive } from "./post-live";
import { RollingNumber } from "./rolling-number";

// Heart + count. State lives in <PostLiveProvider> (shared with double tap on the photo,
// and kept live from other people's likes).
export function LikeButton() {
  const { liked, likeCount, setLike } = usePostLive();
  const button = useRef<HTMLButtonElement>(null);
  const icon = useRef<SVGSVGElement>(null);
  const previous = useRef(liked);

  // Liking: the heart jumps and throws off sparks. Unliking: a small deflate.
  useGSAP(
    () => {
      const was = previous.current;
      previous.current = liked;
      if (was === liked || reducedMotion()) return; // first render (also StrictMode's re-run)
      if (liked) {
        gsap
          .timeline()
          .fromTo(
            icon.current,
            { scale: 0.4, rotation: -20 },
            { scale: 1.4, rotation: 10, duration: 0.2, ease: "back.out(3)" }
          )
          .to(icon.current, { scale: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1.2, 0.3)" });
        if (button.current) miniBurst(button.current);
      } else {
        gsap.fromTo(icon.current, { scale: 0.7 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      }
    },
    { dependencies: [liked] }
  );

  return (
    <span className="relative flex items-center gap-1.5 text-sm">
      <button
        ref={button}
        type="button"
        onClick={() => setLike(!liked)}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        className="active:scale-90"
      >
        <Heart
          ref={icon}
          className={`size-6 transition-colors duration-200 ${liked ? "fill-red-500 text-red-500" : "hover:text-neutral-500"}`}
        />
      </button>
      {/* Just the number on screen; screen readers hear "3 likes" */}
      <span>
        <RollingNumber value={likeCount} testId="like-count" />
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
      className="flex items-center gap-1.5 text-sm transition-transform hover:opacity-70 active:scale-90"
    >
      <MessageCircle className="size-6" />
      <RollingNumber value={commentCount} testId="comment-count" />
    </Link>
  );
}
