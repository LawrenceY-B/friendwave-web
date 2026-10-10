"use client";

import { setLiked } from "@/lib/actions";
import { createContext, type ReactNode, useCallback, useContext, useOptimistic, useState, useTransition } from "react";
import { useSocketEvent, useWatchPosts } from "./realtime-provider";

interface Counts {
  postId: string;
  likeCount: number;
  commentCount: number;
}

interface PostLive {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  // like(true) from a double tap only ever likes; the heart button toggles
  setLike: (liked: boolean) => void;
}

export const PostLiveContext = createContext<PostLive | null>(null);

// Shared, live state for one post on screen: the like button, the photos (double tap)
// and the comment count all read it. Subscribes to the post's live updates while mounted,
// so likes and comments from other people change the counts without a refresh.
export function PostLiveProvider({
  postId,
  liked: initialLiked,
  likeCount: initialLikes,
  commentCount: initialComments,
  children,
}: {
  postId: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  children: ReactNode;
}) {
  const [state, setState] = useState({ liked: initialLiked, likeCount: initialLikes });
  const [optimistic, setOptimistic] = useOptimistic(state);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [, startTransition] = useTransition();

  useWatchPosts([postId]);
  useSocketEvent<Counts>("post:counts", (counts) => {
    if (counts.postId !== postId) return;
    // Counts come from the server; whether *you* liked it stays yours
    setState((prev) => ({ ...prev, likeCount: counts.likeCount }));
    setCommentCount(counts.commentCount);
  });

  const setLike = useCallback(
    (liked: boolean) => {
      if (liked === optimistic.liked) return; // already in that state: nothing to send
      startTransition(async () => {
        setOptimistic({ liked, likeCount: optimistic.likeCount + (liked ? 1 : -1) });
        setState(await setLiked(postId, liked));
      });
    },
    [optimistic, postId, setOptimistic]
  );

  return (
    <PostLiveContext value={{ liked: optimistic.liked, likeCount: optimistic.likeCount, commentCount, setLike }}>
      {children}
    </PostLiveContext>
  );
}

export function usePostLive() {
  const value = useContext(PostLiveContext);
  if (!value) throw new Error("usePostLive must be used inside <PostLiveProvider>");
  return value;
}
