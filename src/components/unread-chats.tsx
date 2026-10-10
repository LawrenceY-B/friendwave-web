"use client";

import type { Message } from "@/interfaces/api";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { addUnreadChat, markChatSeen, seedUnreadChats, useUnreadChatIds } from "@/lib/unread-chats";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useSocketEvent } from "./realtime-provider";

// Mounted once (from the header's UserMenu): seeds the unread chats from the server and keeps
// them live. A message from someone else marks its chat unread, unless you're in that chat.
export function UnreadChatsSync({ initialIds, meId }: { initialIds: string[]; meId: string }) {
  const pathname = usePathname();
  const seeded = useRef(false);
  useLayoutEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    seedUnreadChats(initialIds);
  }, [initialIds]);

  useSocketEvent<Message>("message:new", (message) => {
    if (message.senderId !== meId && pathname !== `/chats/${message.chatId}`) addUnreadChat(message.chatId);
  });
  useSocketEvent<{ chatId: string }>("chat:read", ({ chatId }) => markChatSeen(chatId));
  return null;
}

// The red dot on a Chats icon while any chat has unread messages; pops in like the bell's
export function ChatsDot() {
  const count = useUnreadChatIds()?.size ?? 0;
  const dot = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (count > 0 && !reducedMotion())
        gsap.fromTo(dot.current, { scale: 0 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.4, 0.35)" });
    },
    { dependencies: [count > 0] }
  );
  if (count === 0) return null;
  return (
    <span
      ref={dot}
      data-testid="chats-dot"
      className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black"
    />
  );
}

export const useChatsLabel = () => {
  const count = useUnreadChatIds()?.size ?? 0;
  return count > 0 ? `Chats (${count} unread)` : "Chats";
};

// The desktop header's Chats icon, with the dot
export function ChatsNavIcon({ className }: { className: string }) {
  const label = useChatsLabel();
  return (
    <Link href="/chats" aria-label={label} title={label} className={`relative ${className}`}>
      {/* Dot pinned to the icon itself, not the padded link (same as the bottom bar) */}
      <span className="relative block">
        <MessageCircle className="size-5" />
        <ChatsDot />
      </span>
    </Link>
  );
}
