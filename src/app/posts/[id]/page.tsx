import { AddToStoryButton } from "@/components/add-to-story-button";
import { Comments } from "@/components/comments";
import { DeletePostButton } from "@/components/delete-post-button";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/post-skeleton";
import type { Comment, Post, Profile } from "@/interfaces/api";
import { api, ApiError, apiPage } from "@/lib/api";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostView params={params} />
    </Suspense>
  );
}

async function PostView({ params }: { params: PageProps<"/posts/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/.test(id)) notFound();
  const [me, post, comments] = await loadPost(id);
  const isMine = post.author?.id === me.id;

  return (
    <div className="space-y-6">
      <PostCard post={post} />
      {isMine && (
        <div className="flex gap-6">
          <AddToStoryButton postId={post.id} />
          <DeletePostButton postId={post.id} />
        </div>
      )}
      <Comments
        postId={post.id}
        postAuthorId={post.author?.id ?? null}
        meId={me.id}
        comments={comments.items}
        nextCursor={comments.nextCursor}
      />
    </div>
  );
}

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
