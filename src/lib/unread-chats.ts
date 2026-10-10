"use client";

import { useSyncExternalStore } from "react";

// Which chats have unread messages, for the red dot on Chats (bottom bar + header) and the
// chat list. Seeded from the server (GET /api/chats/unread), then kept live by
// <UnreadChatsSync> from message:new and chat:read.
let unread: Set<string> | null = null; // null until seeded (in the browser)
const listeners = new Set<() => void>();
const set = (next: Set<string> | null) => {
  unread = next;
  listeners.forEach((l) => l());
};

export const seedUnreadChats = (ids: string[]) => set(new Set(ids));
export function addUnreadChat(id: string) {
  if (unread && !unread.has(id)) set(new Set(unread).add(id));
}
export function markChatSeen(id: string) {
  if (!unread?.has(id)) return;
  const next = new Set(unread);
  next.delete(id);
  set(next);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// null until seeded: then go by the counts the server sent with the page
export const useUnreadChatIds = (): ReadonlySet<string> | null =>
  useSyncExternalStore(
    subscribe,
    () => unread,
    () => null
  );
