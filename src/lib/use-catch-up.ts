"use client";

import { useRealtime } from "@/components/realtime-provider";
import { useEffect, useRef } from "react";

// Runs `refresh` when live updates may have been missed: the app coming back on screen
// (phones pause backgrounded apps and drop the connection) or the connection coming back
// after a drop. Used to re-check unread chats and notifications with the server.
export function useCatchUp(refresh: () => void) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  });

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && latest.current();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, []);

  const { status } = useRealtime();
  const dropped = useRef(false);
  useEffect(() => {
    if (status === "offline") dropped.current = true;
    if (status === "live" && dropped.current) {
      dropped.current = false;
      latest.current();
    }
  }, [status]);
}
