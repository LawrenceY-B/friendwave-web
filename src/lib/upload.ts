"use client";

import type { Message, Post } from "@/interfaces/api";
import { getAccessToken } from "@auth0/nextjs-auth0";

// Creates a post by uploading straight from the browser to the API, not through
// Next's server. On Vercel every request to the Next server is capped at 4.5 MB,
// which a few photos can exceed; the API has no such cap (it allows 5 MB per photo).
// XMLHttpRequest (not fetch) because it reports upload progress.
export async function uploadPost(
  images: File[],
  caption: string,
  onProgress: (fraction: number) => void
): Promise<Post> {
  let token: string;
  try {
    token = await getAccessToken(); // from the SDK's /auth/access-token route
  } catch {
    throw new Error("Your session has expired. Please log in again.");
  }

  const form = new FormData();
  images.forEach((image) => form.append("images", image, image.name));
  form.append("caption", caption);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/posts`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { success?: boolean; data?: Post; message?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.success && body.data) resolve(body.data);
      else reject(new Error(body?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Couldn't reach the server. Check your connection and try again."));
    xhr.send(form);
  });
}

// Sends a photo (with an optional caption) in a chat, straight to the API like a post
export async function uploadChatPhoto(
  chatId: string,
  image: File,
  text: string,
  onProgress: (fraction: number) => void = () => {}
): Promise<Message> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new Error("Your session has expired. Please log in again.");
  }
  const form = new FormData();
  form.append("image", image, image.name);
  if (text) form.append("text", text);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/api/chats/${chatId}/messages`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { success?: boolean; data?: Message; message?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.success && body.data) resolve(body.data);
      else reject(new Error(body?.message ?? `Couldn't send the photo (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Couldn't reach the server. Check your connection and try again."));
    xhr.send(form);
  });
}
