"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// How many in-app pages are "behind" the current one in this tab's history.
// A module variable resets on every full page load (refresh, a link from outside,
// the login redirect), which is exactly when there's no in-app page to go back to.
let depth = 0;
let wentBack = false;

// Mounted once in the layout: counts in-app navigations
export function NavigationTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      wentBack = true; // browser/our Back (or Forward, rare): treated as one step back
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (previous.current !== null && previous.current !== pathname) {
      depth = wentBack ? Math.max(0, depth - 1) : depth + 1;
    }
    wentBack = false;
    previous.current = pathname;
  }, [pathname]);

  return null;
}

// Back to the previous page if it's inside the app, otherwise to `fallback`
// (e.g. a profile opened from a shared link goes "back" to the feed, not out of the app)
export function useBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (depth > 0) router.back();
    else router.push(fallback);
  }, [router, fallback]);
}
