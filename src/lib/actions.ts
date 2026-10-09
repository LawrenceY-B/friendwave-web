"use server";

import { revalidatePath } from "next/cache";
import { api } from "./api";

// Server Actions: called from Client Components, run on the server.
// They're reachable by direct POST, so each one authenticates: api() gets the
// user's access token and redirects to login without one. The API checks permissions.

const isId = (id: string) => /^[0-9a-f]{24}$/.test(id);

export async function setLiked(postId: string, liked: boolean) {
  if (!isId(postId)) throw new Error("Invalid post id");
  return api<{ liked: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
    method: liked ? "POST" : "DELETE",
  });
}

export async function setFollowing(userId: string, following: boolean) {
  if (!isId(userId)) throw new Error("Invalid user id");
  const result = await api<{ following: boolean; followerCount: number }>(`/api/users/${userId}/follow`, {
    method: following ? "POST" : "DELETE",
  });
  // Re-render the profile (follower count) and the feed (their posts appear/disappear)
  revalidatePath(`/users/${userId}`);
  revalidatePath("/");
  return result;
}
