"use client";

import { useLayoutEffect } from "react";

// Full-screen views (chat room, story viewer, post overlay) hide the app header outright
// instead of only covering it: iPhone Safari can paint the header's blurred sticky bar above
// a fixed overlay whatever the z-index, so the "Friendwave" bar showed through the chat.
// A counter, so overlapping full-screen views (a post opened from stories) work.
let open = 0;

export function useHideAppHeader(active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    open++;
    document.documentElement.dataset.fullscreen = "";
    return () => {
      open--;
      if (open === 0) delete document.documentElement.dataset.fullscreen;
    };
  }, [active]);
}
