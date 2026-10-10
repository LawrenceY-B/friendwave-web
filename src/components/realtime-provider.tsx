"use client";

import { connectSocket } from "@/lib/socket";
import { getAccessToken } from "@auth0/nextjs-auth0";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type Status = "connecting" | "live" | "offline";

interface Realtime {
  socket: Socket | null;
  status: Status;
  watch: (postIds: string[]) => void;
  unwatch: (postIds: string[]) => void;
}

const RealtimeContext = createContext<Realtime>({
  socket: null,
  status: "offline",
  watch: () => {},
  unwatch: () => {},
});

// One live connection per browser tab, shared by everything on the page
// (chat, live counts, comments, notifications, presence). Only connects when logged in.
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  // How many components on screen watch each post; subscribe on the first, unsubscribe after the last
  const watchCounts = useRef(new Map<string, number>());

  useEffect(() => {
    let cancelled = false;
    let s: Socket | null = null;
    (async () => {
      try {
        await getAccessToken(); // throws when logged out: then don't connect at all
      } catch {
        setStatus("offline");
        return;
      }
      if (cancelled) return;
      s = connectSocket();
      s.on("connect", () => {
        setStatus("live");
        // Subscriptions don't survive a reconnect: send them again
        const ids = [...watchCounts.current.keys()];
        if (ids.length) s!.emit("posts:watch", { postIds: ids });
      });
      s.on("disconnect", () => setStatus("offline"));
      s.on("connect_error", () => setStatus("offline"));
      setSocket(s);
    })();
    return () => {
      cancelled = true;
      s?.disconnect();
    };
  }, []);

  const watch = useCallback(
    (postIds: string[]) => {
      const fresh = postIds.filter((id) => {
        const count = watchCounts.current.get(id) ?? 0;
        watchCounts.current.set(id, count + 1);
        return count === 0;
      });
      if (fresh.length && socket?.connected) socket.emit("posts:watch", { postIds: fresh });
    },
    [socket]
  );

  const unwatch = useCallback(
    (postIds: string[]) => {
      const gone = postIds.filter((id) => {
        const count = (watchCounts.current.get(id) ?? 0) - 1;
        if (count <= 0) watchCounts.current.delete(id);
        else watchCounts.current.set(id, count);
        return count <= 0;
      });
      if (gone.length && socket?.connected) socket.emit("posts:unwatch", { postIds: gone });
    },
    [socket]
  );

  const value = useMemo(() => ({ socket, status, watch, unwatch }), [socket, status, watch, unwatch]);
  return <RealtimeContext value={value}>{children}</RealtimeContext>;
}

export const useRealtime = () => useContext(RealtimeContext);

// Runs `handler` for every `event` from the server while the component is on screen
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { socket } = useRealtime();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!socket) return;
    const listener = (payload: T) => latest.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

// Subscribes to live updates (counts, comments) for these posts while on screen
export function useWatchPosts(postIds: string[]) {
  const { watch, unwatch, socket } = useRealtime();
  const key = postIds.join(",");
  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (!ids.length) return;
    watch(ids);
    return () => unwatch(ids);
  }, [key, watch, unwatch, socket]);
}

// Who's online among these users (only answered for people you share a chat with)
export function usePresence(userIds: string[]) {
  const { socket, status } = useRealtime();
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const key = userIds.join(",");

  useEffect(() => {
    if (!socket || status !== "live" || !key) return;
    let cancelled = false;
    socket
      .timeout(5000)
      .emitWithAck("presence:query", { userIds: key.split(",") })
      .then((res: { success: boolean; data?: Record<string, boolean> }) => {
        if (!cancelled && res.success && res.data) setOnline((prev) => ({ ...prev, ...res.data }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [socket, status, key]);

  useSocketEvent<{ userId: string; online: boolean }>("presence:update", ({ userId, online: isOnline }) => {
    setOnline((prev) => ({ ...prev, [userId]: isOnline }));
  });

  return online;
}
