"use server";

import type { Chat, Message } from "@/interfaces/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, apiPage } from "./api";

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

// "Message" button on a profile: opens the existing chat with that person, or creates one
export async function openChat(userId: string) {
  if (!isId(userId)) throw new Error("Invalid user id");
  const chat = await api<Chat>("/api/chats", { method: "POST", body: JSON.stringify({ userId }) });
  redirect(`/chats/${chat.id}`);
}

// Used when the live connection is down; the API still pushes it to everyone live
export async function sendMessage(chatId: string, text: string) {
  if (!isId(chatId)) throw new Error("Invalid chat id");
  return api<Message>(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ text }) });
}

// Newest first. Without a cursor: the latest page (used to catch up after a reconnect).
export async function loadMessages(chatId: string, cursor?: string) {
  if (!isId(chatId) || (cursor !== undefined && !isId(cursor))) throw new Error("Invalid id");
  return apiPage<Message>(`/api/chats/${chatId}/messages?limit=30${cursor ? `&cursor=${cursor}` : ""}`);
}

export async function deleteMessage(messageId: string) {
  if (!isId(messageId)) throw new Error("Invalid message id");
  await api<null>(`/api/messages/${messageId}`, { method: "DELETE" });
}
