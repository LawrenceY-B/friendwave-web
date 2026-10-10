import type { Comment, Post, Profile } from "@/interfaces/api";
import { api, ApiError, apiPage } from "@/lib/api";
import { notFound } from "next/navigation";
import { Comments } from "./comments";
import { PostCaption, PostCard, PostCounts, PostHeader, PostLive } from "./post-card";
import { PostImages } from "./post-images";

async function loadPost(id: string) {
  try {
    return await Promise.all([
      api<Profile>("/api/users/me"),
      api<Post>(`/api/posts/${id}`),
      apiPage<Comment>(`/api/posts/${id}/comments?limit=20`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

// A post with its comments. "page" for direct links (/posts/:id opened fresh);
// "overlay" when opened on top of another page: photo beside the comments on larger screens.
export async function PostDetail({ id, variant }: { id: string; variant: "page" | "overlay" }) {
  if (!/^[0-9a-f]{24}$/.test(id)) notFound();
  const [me, post, comments] = await loadPost(id);
  const commentsList = (
    <Comments
      postId={post.id}
      postAuthorId={post.author?.id ?? null}
      meId={me.id}
      comments={comments.items}
      nextCursor={comments.nextCursor}
    />
  );

  if (variant === "page") {
    return (
      <div className="space-y-6">
        <PostCard post={post} meId={me.id} />
        {commentsList}
      </div>
    );
  }

  return (
    <PostLive post={post}>
      <div className="grid h-full grid-rows-[auto_1fr] sm:grid-cols-[minmax(0,1fr)_22rem] sm:grid-rows-1">
        <div className="flex items-center bg-black">
          <div className="w-full">
            <PostImages images={post.images} alt={post.caption || `Photo by ${post.author?.username ?? "unknown"}`} />
          </div>
        </div>
        <div className="flex min-h-0 flex-col border-neutral-200 sm:border-l dark:border-neutral-800">
          <PostHeader post={post} meId={me.id} />
          <div className="flex-1 space-y-4 overflow-y-auto border-y border-neutral-200 p-3 dark:border-neutral-800">
            <PostCaption post={post} />
            {commentsList}
          </div>
          <div className="p-3">
            <PostCounts post={post} />
          </div>
        </div>
      </div>
    </PostLive>
  );
}
