"use client";

import { useEffect } from "react";

// Registers public/sw.js (offline page + cached app files) in production builds only,
// so local development never runs behind a cached worker.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Not fatal: the app works the same, just without the offline page
    });
  }, []);
  return null;
}
