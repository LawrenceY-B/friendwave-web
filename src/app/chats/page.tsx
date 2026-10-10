import { ChatList } from "@/components/chat-list";
import { PageTitle } from "@/components/page-title";
import type { Chat, Profile } from "@/interfaces/api";
import { api } from "@/lib/api";
import { Suspense } from "react";

export default function ChatsPage() {
  return (
    <div className="space-y-4">
      {/* A bottom tab: title in the phone header, no Back */}
      <PageTitle title="Chats" />
      <h1 className="hidden text-xl font-semibold sm:block">Chats</h1>
      <Suspense fallback={<ChatListSkeleton />}>
        <Chats />
      </Suspense>
    </div>
  );
}

async function Chats() {
  const [me, chats] = await Promise.all([api<Profile>("/api/users/me"), api<Chat[]>("/api/chats")]);

  if (chats.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-neutral-500">
        No chats yet. Open someone&apos;s profile and tap <b>Message</b>.
      </p>
    );
  }

  return <ChatList chats={chats} meId={me.id} />;
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
