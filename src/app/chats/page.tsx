import { Avatar } from "@/components/avatar";
import type { Chat, Profile } from "@/interfaces/api";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import Link from "next/link";
import { Suspense } from "react";

export default function ChatsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Chats</h1>
      <Suspense fallback={<ChatListSkeleton />}>
        <ChatList />
      </Suspense>
    </div>
  );
}

async function ChatList() {
  const [me, chats] = await Promise.all([api<Profile>("/api/users/me"), api<Chat[]>("/api/chats")]);

  if (chats.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-500">
        No chats yet. Open someone&apos;s profile and tap <b>Message</b>.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
      {chats.map((chat) => {
        const other = chat.participants[0] ?? null;
        const last = chat.lastMessage;
        return (
          <li key={chat.id}>
            <Link
              href={`/chats/${chat.id}`}
              className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <Avatar user={other} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{other?.username ?? "Deleted user"}</p>
                <p className="truncate text-sm text-neutral-500">
                  {last ? `${last.senderId === me.id ? "You: " : ""}${last.text}` : "No messages yet"}
                </p>
              </div>
              <time dateTime={chat.updatedAt} className="shrink-0 text-xs text-neutral-500">
                {timeAgo(chat.updatedAt)}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ChatListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
