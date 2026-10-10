"use client";

import type { Chat, Message } from "@/interfaces/api";
import { timeAgo } from "@/lib/format";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./avatar";
import { usePresence, useSocketEvent } from "./realtime-provider";

// The chat list, kept live: green dots for who's online, and a new message moves
// its chat to the top with the new preview.
export function ChatList({ chats: initialChats, meId }: { chats: Chat[]; meId: string }) {
  const [chats, setChats] = useState(initialChats);
  const presence = usePresence(chats.map((c) => c.participants[0]?.id).filter(Boolean) as string[]);

  useSocketEvent<Message>("message:new", (message) => {
    setChats((prev) => {
      const chat = prev.find((c) => c.id === message.chatId);
      if (!chat) return prev; // a brand-new chat: shows up on the next visit
      const updated = { ...chat, lastMessage: message, updatedAt: message.createdAt };
      return [updated, ...prev.filter((c) => c.id !== message.chatId)];
    });
  });

  return (
    <ul className="-mx-3">
      {chats.map((chat) => {
        const other = chat.participants[0] ?? null;
        const last = chat.lastMessage;
        return (
          <li key={chat.id}>
            <Link
              href={`/chats/${chat.id}`}
              className="flex items-center gap-3 rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <Avatar user={other} online={other ? presence[other.id] === true : false} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{other?.username ?? "Deleted user"}</p>
                <p className="truncate text-sm text-neutral-500">
                  {last ? `${last.senderId === meId ? "You: " : ""}${last.text}` : "No messages yet"}
                </p>
              </div>
              <time suppressHydrationWarning dateTime={chat.updatedAt} className="shrink-0 text-xs text-neutral-500">
                {timeAgo(chat.updatedAt)}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
