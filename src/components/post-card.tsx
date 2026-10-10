import type { Post } from "@/interfaces/api";
import { plural, timeAgo } from "@/lib/format";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { LikeButton } from "./like-button";
import { PostImages } from "./post-images";
import { PostMenu } from "./post-menu";

// The pieces of a post, also used side by side in the post overlay (post-detail.tsx)

export function PostHeader({ post, meId }: { post: Post; meId: string }) {
  return (
    <header className="flex items-center gap-3 p-3">
      <Avatar user={post.author} size="sm" />
      {post.author ? (
        <Link href={`/users/${post.author.id}`} className="text-sm font-semibold hover:underline">
          {post.author.username}
        </Link>
      ) : (
        <span className="text-sm text-neutral-500">Deleted user</span>
      )}
      {/* Opens the post on top of the current page */}
      <Link href={`/posts/${post.id}`} className="ml-auto text-xs text-neutral-500 hover:underline">
        <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
      </Link>
      <PostMenu post={post} meId={meId} />
    </header>
  );
}

export function PostCounts({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-4">
      <LikeButton postId={post.id} initial={{ liked: post.likedByMe, likeCount: post.likeCount }} />
      <Link
        href={`/posts/${post.id}`}
        aria-label={`${plural(post.commentCount, "comment")}, open comments`}
        className="flex items-center gap-1.5 text-sm hover:opacity-70"
      >
        <MessageCircle className="size-6" />
        <span data-testid="comment-count">{post.commentCount.toLocaleString("en")}</span>
      </Link>
    </div>
  );
}

export function PostCaption({ post }: { post: Post }) {
  if (!post.caption) return null;
  return (
    <p className="text-sm">
      <span className="mr-1.5 font-semibold">{post.author?.username}</span>
      {post.caption}
    </p>
  );
}

export function PostCard({ post, meId }: { post: Post; meId: string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <PostHeader post={post} meId={meId} />
      <PostImages images={post.images} alt={post.caption || `Photo by ${post.author?.username ?? "unknown"}`} />
      <div className="space-y-2 p-3">
        <PostCounts post={post} />
        <PostCaption post={post} />
      </div>
    </article>
  );
}
