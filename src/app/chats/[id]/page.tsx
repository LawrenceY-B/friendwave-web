import { ChatRoom } from "@/components/chat-room";
import type { Chat, Message, Profile } from "@/interfaces/api";
import { api, ApiError, apiPage } from "@/lib/api";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default function ChatPage({ params }: PageProps<"/chats/[id]">) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatView params={params} />
    </Suspense>
  );
}

// The chat's full-screen wallpaper with placeholder pills, so nothing jumps when it loads
function ChatSkeleton() {
  return (
    <div className="chat-wallpaper fixed inset-0 z-40">
      <div className="mx-auto flex max-w-xl animate-pulse items-center gap-2 px-3 pt-3">
        <div className="size-11 rounded-full bg-white/60 dark:bg-white/10" />
        <div className="h-11 flex-1 rounded-full bg-white/60 dark:bg-white/10" />
        <div className="size-10 rounded-full bg-white/60 dark:bg-white/10" />
      </div>
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-xl animate-pulse gap-2 px-3 pb-3">
        <div className="h-11 flex-1 rounded-full bg-white/60 dark:bg-white/10" />
        <div className="size-11 rounded-full bg-white/60 dark:bg-white/10" />
      </div>
    </div>
  );
}

// Loads the chat and its latest messages on the server; from then on the
// ChatRoom (in the browser) keeps them up to date over the live connection.
async function ChatView({ params }: { params: PageProps<"/chats/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/.test(id)) notFound();

  const [me, chat, page] = await loadChat(id);
  // key: a fresh ChatRoom (and connection) per chat when navigating between chats
  return (
    <ChatRoom key={chat.id} chat={chat} meId={me.id} initialMessages={page.items} initialCursor={page.nextCursor} />
  );
}

async function loadChat(id: string) {
  try {
    return await Promise.all([
      api<Profile>("/api/users/me"),
      api<Chat>(`/api/chats/${id}`),
      apiPage<Message>(`/api/chats/${id}/messages?limit=30`),
    ]);
  } catch (error) {
    // Not a member, or the chat doesn't exist: the API answers 404 either way
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
