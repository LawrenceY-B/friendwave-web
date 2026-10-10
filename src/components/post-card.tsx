import type { Post } from "@/interfaces/api";
import { timeAgo } from "@/lib/format";
import Link from "next/link";
import { Avatar } from "./avatar";
import { CommentCountLink, LikeButton } from "./like-button";
import { PostImages } from "./post-images";
import { PostLiveProvider } from "./post-live";
import { PostMenu } from "./post-menu";

// The pieces of a post, also used side by side in the post overlay (post-detail.tsx)

export function PostHeader({ post, meId }: { post: Post; meId: string }) {
  return (
    <header className="flex items-center gap-3 px-1 py-3">
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

// Must be inside <PostLive> (counts are shared and live)
export function PostCounts({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-4">
      <LikeButton />
      <CommentCountLink postId={post.id} />
    </div>
  );
}

// Wraps a post's pieces with its shared, live like/comment state
export function PostLive({ post, children }: { post: Post; children: React.ReactNode }) {
  return (
    <PostLiveProvider
      postId={post.id}
      liked={post.likedByMe}
      likeCount={post.likeCount}
      commentCount={post.commentCount}
    >
      {children}
    </PostLiveProvider>
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
    <PostLive post={post}>
      {/* Instagram-style: no card, just a thin line under each post */}
      <article data-reveal className="border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <PostHeader post={post} meId={meId} />
        <div className="overflow-hidden rounded-md">
          <PostImages
            parallax
            images={post.images}
            alt={post.caption || `Photo by ${post.author?.username ?? "unknown"}`}
          />
        </div>
        <div className="space-y-2 px-1 pt-3">
          <PostCounts post={post} />
          <PostCaption post={post} />
        </div>
      </article>
    </PostLive>
  );
}
