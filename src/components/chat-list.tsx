"use client";

import type { Chat, Message } from "@/interfaces/api";
import { loadChats } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import { useUnreadChatIds } from "@/lib/unread-chats";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { usePresence, useSocketEvent } from "./realtime-provider";

// The chat list, kept live: green dots for who's online, unread counts, and a new message
// moves its chat to the top with the new preview.
export function ChatList({ chats: initialChats, meId }: { chats: Chat[]; meId: string }) {
  const [chats, setChats] = useState(initialChats);
  const presence = usePresence(chats.map((c) => c.participants[0]?.id).filter(Boolean) as string[]);
  // The live unread set (also updated while this list is hidden in the background)
  const unreadIds = useUnreadChatIds();

  useSocketEvent<Message>("message:new", (message) => {
    setChats((prev) => {
      const chat = prev.find((c) => c.id === message.chatId);
      if (!chat) return prev; // a brand-new chat: shows up on the next visit
      const fromThem = message.senderId !== meId;
      const updated = {
        ...chat,
        lastMessage: message,
        updatedAt: message.createdAt,
        unreadCount: fromThem ? (chat.unreadCount ?? 0) + 1 : 0, // replying means you've read it
      };
      return [updated, ...prev.filter((c) => c.id !== message.chatId)];
    });
  });
  useSocketEvent<{ chatId: string }>("chat:read", ({ chatId }) =>
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)))
  );

  // Coming back to the list (Next.js kept it alive but it wasn't listening): fetch it fresh
  const shownBefore = useRef(false);
  useEffect(() => {
    if (shownBefore.current) void loadChats().then(setChats, () => {});
    shownBefore.current = true;
  }, []);

  return (
    <ul className="-mx-3">
      {chats.map((chat) => {
        const other = chat.participants[0] ?? null;
        const last = chat.lastMessage;
        // Unread only while the live set agrees (you may have read it in another tab);
        // before it's seeded, what the server said
        const unread = unreadIds
          ? unreadIds.has(chat.id)
            ? Math.max(chat.unreadCount ?? 0, 1)
            : 0
          : (chat.unreadCount ?? 0);
        return (
          <li key={chat.id} data-reveal data-unread={unread > 0 || undefined}>
            <Link
              href={`/chats/${chat.id}`}
              aria-label={`${other?.username ?? "Deleted user"}${unread ? `, ${unread} unread` : ""}`}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <Avatar user={other} online={other ? presence[other.id] === true : false} />
              <div className="min-w-0 flex-1">
                <p className={unread ? "font-semibold" : "font-medium"}>{other?.username ?? "Deleted user"}</p>
                <p
                  className={`truncate text-sm ${unread ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-500"}`}
                >
                  {last ? `${last.senderId === meId ? "You: " : ""}${last.text}` : "No messages yet"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <time
                  suppressHydrationWarning
                  dateTime={chat.updatedAt}
                  className={`text-xs ${unread ? "font-medium text-blue-600 dark:text-blue-400" : "text-neutral-500"}`}
                >
                  {timeAgo(chat.updatedAt)}
                </time>
                {unread > 0 && (
                  <span
                    data-testid="unread-badge"
                    className="min-w-5 rounded-full bg-blue-600 px-1.5 text-center text-xs leading-5 font-semibold text-white"
                  >
                    {unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
