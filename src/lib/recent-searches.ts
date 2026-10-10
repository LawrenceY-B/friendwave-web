"use client";

import type { UserSummary } from "@/interfaces/api";
import { useSyncExternalStore } from "react";

// People you opened from search, newest first, remembered in this browser only
const KEY = "friendwave:recent-searches";
const MAX = 8;
const CHANGE = "friendwave:recent-searches-changed";

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): UserSummary[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: UserSummary[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CHANGE));
  } catch {
    // storage blocked: recent searches are a nicety
  }
}

export function rememberSearch(user: UserSummary) {
  const { id, username, name, avatarUrl } = user;
  write([{ id, username, name, avatarUrl }, ...parse(readRaw()).filter((u) => u.id !== id)].slice(0, MAX));
}

export function forgetSearch(id: string) {
  write(parse(readRaw()).filter((u) => u.id !== id));
}

export function clearSearches() {
  write([]);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useRecentSearches(): UserSummary[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  return parse(raw);
}
