"use server";

import type { Chat, Comment, Message, Post, Profile } from "@/interfaces/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError, apiPage } from "./api";
import { MAX_BIO, MAX_CAPTION, MAX_IMAGE_BYTES, MAX_IMAGES, MAX_NAME, USERNAME_HINT, USERNAME_PATTERN } from "./limits";

// Server Actions: called from Client Components, run on the server.
// They're reachable by direct POST, so each one authenticates: api() gets the
// user's access token and redirects to login without one. The API checks permissions.

const isId = (id: string) => /^[0-9a-f]{24}$/.test(id);
const isReplyId = (id: string) => /^[0-9a-f-]{36}$/.test(id);

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

// ---- posts ----

export interface CreatePostState {
  error?: string;
}

// Used with useActionState: returns { error } for problems the user can fix,
// and redirects to the new post on success.
export async function createPost(_prev: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const caption = String(formData.get("caption") ?? "").trim();
  if (images.length === 0) return { error: "Add at least one photo." };
  if (images.length > MAX_IMAGES) return { error: `You can add up to ${MAX_IMAGES} photos.` };
  if (images.some((f) => !f.type.startsWith("image/"))) return { error: "Only images can be uploaded." };
  if (images.some((f) => f.size > MAX_IMAGE_BYTES)) return { error: "Each photo must be 5 MB or smaller." };
  if (caption.length > MAX_CAPTION) return { error: "The caption is too long." };

  // Rebuild the form so only the fields the API expects are sent
  const body = new FormData();
  images.forEach((image) => body.append("images", image, image.name));
  body.append("caption", caption);

  let post: Post;
  try {
    post = await api<Post>("/api/posts", { method: "POST", body });
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) return { error: error.message };
    throw error;
  }
  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

export async function deletePost(postId: string) {
  if (!isId(postId)) throw new Error("Invalid post id");
  await api<null>(`/api/posts/${postId}`, { method: "DELETE" });
  revalidatePath("/");
  redirect("/");
}

// ---- comments (each re-renders the post page with the change) ----

const checkText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) throw new Error("Comments must be 1-500 characters");
  return trimmed;
};

export async function loadComments(postId: string, cursor: string) {
  if (!isId(postId) || !isId(cursor)) throw new Error("Invalid id");
  return apiPage<Comment>(`/api/posts/${postId}/comments?limit=20&cursor=${cursor}`);
}

export async function addComment(postId: string, text: string) {
  if (!isId(postId)) throw new Error("Invalid post id");
  await api(`/api/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ text: checkText(text) }) });
  revalidatePath(`/posts/${postId}`);
}

export async function removeComment(postId: string, commentId: string) {
  if (!isId(postId) || !isId(commentId)) throw new Error("Invalid id");
  await api(`/api/comments/${commentId}`, { method: "DELETE" });
  revalidatePath(`/posts/${postId}`);
}

export async function addReply(postId: string, commentId: string, text: string) {
  if (!isId(postId) || !isId(commentId)) throw new Error("Invalid id");
  await api(`/api/comments/${commentId}/replies`, { method: "POST", body: JSON.stringify({ text: checkText(text) }) });
  revalidatePath(`/posts/${postId}`);
}

export async function removeReply(postId: string, commentId: string, replyId: string) {
  if (!isId(postId) || !isId(commentId) || !isReplyId(replyId)) throw new Error("Invalid id");
  await api(`/api/comments/${commentId}/replies/${replyId}`, { method: "DELETE" });
  revalidatePath(`/posts/${postId}`);
}

// ---- profile ----

export interface UpdateProfileState {
  error?: string;
}

// Used with useActionState. The form only includes fields that changed.
export async function updateProfile(_prev: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  const body = new FormData();
  const name = formData.get("name");
  const username = formData.get("username");
  const bio = formData.get("bio");
  const avatar = formData.get("avatar");

  if (typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > MAX_NAME) return { error: `Name must be 1-${MAX_NAME} characters.` };
    body.append("name", trimmed);
  }
  if (typeof username === "string") {
    if (!new RegExp(USERNAME_PATTERN).test(username)) return { error: `Username: ${USERNAME_HINT}.` };
    body.append("username", username);
  }
  if (typeof bio === "string") {
    if (bio.length > MAX_BIO) return { error: `Bio can be at most ${MAX_BIO} characters.` };
    body.append("bio", bio);
  }
  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) return { error: "Your picture must be an image." };
    if (avatar.size > MAX_IMAGE_BYTES) return { error: "Your picture must be 5 MB or smaller." };
    body.append("avatar", avatar, avatar.name);
  }

  let me: Profile;
  try {
    me = await api<Profile>("/api/users/me", { method: "PATCH", body });
  } catch (error) {
    // 409 username taken, 400 invalid input: show the API's message
    if (error instanceof ApiError && error.status < 500) return { error: error.message };
    throw error;
  }
  // Name, username and picture show up in the header and on posts everywhere
  revalidatePath("/", "layout");
  redirect(`/users/${me.id}`);
}

// ---- stories ----

export async function addToStory(postId: string) {
  if (!isId(postId)) throw new Error("Invalid post id");
  await api("/api/stories", { method: "POST", body: JSON.stringify({ postId }) });
  revalidatePath("/");
}

export async function deleteStory(storyId: string) {
  if (!isId(storyId)) throw new Error("Invalid story id");
  await api(`/api/stories/${storyId}`, { method: "DELETE" });
  revalidatePath("/");
}
