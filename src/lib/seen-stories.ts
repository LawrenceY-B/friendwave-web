"use client";

import { useSyncExternalStore } from "react";

// Which stories you've already watched, remembered in this browser only (the API
// doesn't track views). Used to grey out the ring around people with nothing new.
const KEY = "friendwave:seen-stories";

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]"; // storage blocked (e.g. private mode): treat everything as unseen
  }
}

function parse(raw: string): string[] {
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function markStorySeen(id: string) {
  try {
    // Stories expire after 24h, so keeping the last 500 ids is plenty
    const ids = [...parse(readRaw()).filter((x) => x !== id), id].slice(-500);
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY })); // notify this tab too
  } catch {
    // ignore: seen-state is a nicety
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // fires for other tabs, and for ours (above)
  return () => window.removeEventListener("storage", onChange);
}

// null while rendering on the server (no localStorage there)
export function useSeenStories(): Set<string> | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return raw === null ? null : new Set(parse(raw));
}
