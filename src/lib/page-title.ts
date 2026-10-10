"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

// What the phone header shows instead of "Friendwave": the page's title, and whether
// it gets a back button (not on bottom-tab pages). Set by <PageTitle> on each page.
export interface PageTitleState {
  title: string;
  back: boolean;
  fallback: string; // where Back goes when there's no in-app page behind
}

let current: (PageTitleState & { owner: symbol }) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function usePageTitleState(): PageTitleState | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}

// Sets the header title while the page is on screen. Next.js keeps visited pages alive
// but hidden (<Activity>), which runs this cleanup on hide and the setter again on show.
export function usePageTitle({ title, back, fallback }: PageTitleState) {
  useLayoutEffect(() => {
    const owner = Symbol(title);
    current = { title, back, fallback, owner };
    emit();
    return () => {
      // Only clear it if no newer page has taken over
      if (current?.owner === owner) {
        current = null;
        emit();
      }
    };
  }, [title, back, fallback]);
}
