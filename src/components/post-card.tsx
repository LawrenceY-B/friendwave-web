import type { Post } from "@/interfaces/api";
import { plural, timeAgo } from "@/lib/format";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "./avatar";
import { LikeButton } from "./like-button";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <header className="flex items-center gap-3 p-3">
        <Avatar user={post.author} size="sm" />
        {post.author ? (
          <Link href={`/users/${post.author.id}`} className="text-sm font-semibold hover:underline">
            {post.author.username}
          </Link>
        ) : (
          <span className="text-sm text-neutral-500">Deleted user</span>
        )}
        <Link href={`/posts/${post.id}`} className="ml-auto text-xs text-neutral-500 hover:underline">
          <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        </Link>
      </header>

      {/* Swipe/scroll sideways through multiple images */}
      <div className="flex snap-x snap-mandatory overflow-x-auto bg-neutral-100 dark:bg-neutral-900">
        {post.images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={post.caption || `Photo ${i + 1} by ${post.author?.username ?? "unknown"}`}
            width={600}
            height={600}
            unoptimized
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-4">
          <LikeButton postId={post.id} initial={{ liked: post.likedByMe, likeCount: post.likeCount }} />
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:underline dark:text-neutral-400"
          >
            <MessageCircle className="size-5" />
            {plural(post.commentCount, "comment")}
          </Link>
          {post.images.length > 1 && (
            <span className="ml-auto text-xs text-neutral-500">{post.images.length} photos →</span>
          )}
        </div>
        {post.caption && (
          <p className="text-sm">
            <span className="mr-1.5 font-semibold">{post.author?.username}</span>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
}
