"use client";

import type { Chat, Message } from "@/interfaces/api";
import { deleteMessage, loadMessages, sendMessage } from "@/lib/actions";
import { ArrowLeft, SendHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "./avatar";
import { usePresence, useRealtime, useSocketEvent } from "./realtime-provider";

type UiMessage = Message & { pending?: boolean };

// Adds a message, or replaces the one with the same id, keeping oldest → newest order.
// The same message can arrive twice (the send acknowledgement AND the live
// "message:new" event), so everything goes through here to avoid duplicates.
function upsert(list: UiMessage[], message: UiMessage): UiMessage[] {
  const index = list.findIndex((m) => m.id === message.id);
  if (index >= 0) return list.map((m, i) => (i === index ? message : m));
  return [...list, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const timeOf = (date: string) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface Props {
  chat: Chat;
  meId: string;
  initialMessages: Message[]; // newest first, as the API returns them
  initialCursor: string | null;
}

export function ChatRoom({ chat, meId, initialMessages, initialCursor }: Props) {
  const [messages, setMessages] = useState<UiMessage[]>(() => [...initialMessages].reverse());
  const [cursor, setCursor] = useState(initialCursor);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingOlder, startLoadingOlder] = useTransition();
  const bottomRef = useRef<HTMLLIElement>(null);
  const lastIdRef = useRef<string | undefined>(undefined);
  const other = chat.participants[0] ?? null;
  // The tab's shared live connection (components/realtime-provider.tsx)
  const { socket, status } = useRealtime();
  const presence = usePresence(other ? [other.id] : []);
  const otherOnline = other ? presence[other.id] === true : false;

  // ---- live updates ----
  useSocketEvent<Message>("message:new", (message) => {
    if (message.chatId === chat.id) setMessages((prev) => upsert(prev, message));
  });
  useSocketEvent<Message>("message:updated", (message) => {
    if (message.chatId === chat.id) setMessages((prev) => upsert(prev, message));
  });
  useSocketEvent<{ id: string; chatId: string }>("message:deleted", ({ id, chatId }) => {
    if (chatId === chat.id) setMessages((prev) => prev.filter((m) => m.id !== id));
  });

  // Catch up on anything missed: after the connection drops and comes back, and after
  // returning to this page (Next.js keeps it alive in the background, but it stops
  // listening while hidden)
  const catchUp = async () => {
    const latest = await loadMessages(chat.id).catch(() => null);
    if (latest) setMessages((prev) => latest.items.reduce(upsert, prev));
  };
  const wasOffline = useRef(false);
  useEffect(() => {
    if (status === "offline") wasOffline.current = true;
    if (status === "live" && wasOffline.current) {
      wasOffline.current = false;
      void catchUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to connection changes
  }, [status]);
  const shownBefore = useRef(false);
  useEffect(() => {
    if (shownBefore.current) void catchUp();
    shownBefore.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs each time the page is shown
  }, []);

  // ---- scroll to the newest message when one is added at the bottom ----
  useEffect(() => {
    const lastId = messages.at(-1)?.id;
    if (lastId !== lastIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: lastIdRef.current ? "smooth" : "instant" });
      lastIdRef.current = lastId;
    }
  }, [messages]);

  // ---- actions ----
  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setError(null);

    // Show it right away; swap in the saved message when the server confirms
    const tempId = `temp-${crypto.randomUUID()}`;
    const temp: UiMessage = {
      id: tempId,
      chatId: chat.id,
      senderId: meId,
      text,
      createdAt: new Date().toISOString(),
      editedAt: null,
      pending: true,
    };
    setMessages((prev) => upsert(prev, temp));

    try {
      let saved: Message;
      if (socket?.connected) {
        const response = await socket.timeout(5000).emitWithAck("message:send", { chatId: chat.id, text });
        if (!response.success) throw new Error(response.message ?? "Message not sent");
        saved = response.data;
      } else {
        // No live connection: send over HTTP instead
        saved = await sendMessage(chat.id, text);
      }
      setMessages((prev) =>
        upsert(
          prev.filter((m) => m.id !== tempId),
          saved
        )
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
      setError(err instanceof Error && err.message ? err.message : "Message not sent");
    }
  }

  async function remove(message: UiMessage) {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    try {
      await deleteMessage(message.id);
    } catch {
      setMessages((prev) => upsert(prev, message));
      setError("Couldn't delete that message");
    }
  }

  function loadOlder() {
    if (!cursor) return;
    startLoadingOlder(async () => {
      const page = await loadMessages(chat.id, cursor);
      setMessages((prev) => page.items.reduce(upsert, prev));
      setCursor(page.nextCursor);
    });
  }

  // Enter sends, Shift+Enter adds a new line
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  // ---- view ----
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <header className="flex items-center gap-3 border-b border-neutral-200 p-3 dark:border-neutral-800">
        <Link
          href="/chats"
          aria-label="Back to chats"
          className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar user={other} size="sm" online={otherOnline} />
        {other ? (
          <Link href={`/users/${other.id}`} className="font-semibold hover:underline">
            {other.username}
          </Link>
        ) : (
          <span className="text-neutral-500">Deleted user</span>
        )}
        {/* Only shown when *your* connection is down; otherwise the green dot says it all */}
        {socket && status === "offline" && (
          <span className="ml-auto text-xs text-neutral-500" aria-live="polite">
            Reconnecting…
          </span>
        )}
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto p-4" aria-label="Messages">
        {cursor && (
          <li className="text-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="text-xs text-blue-600 hover:underline"
            >
              {loadingOlder ? "Loading…" : "Load older messages"}
            </button>
          </li>
        )}
        {messages.length === 0 && (
          <li className="py-10 text-center text-sm text-neutral-500">No messages yet. Say hi 👋</li>
        )}
        {messages.map((message) => {
          const mine = message.senderId === meId;
          return (
            <li key={message.id} className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                  mine ? "bg-blue-600 text-white" : "bg-neutral-100 dark:bg-neutral-800"
                } ${message.pending ? "opacity-60" : ""}`}
              >
                {message.text}
                <span className={`mt-0.5 block text-[10px] ${mine ? "text-blue-100" : "text-neutral-500"}`}>
                  {message.pending ? "Sending…" : timeOf(message.createdAt)}
                  {message.editedAt && " · edited"}
                </span>
              </div>
              {mine && !message.pending && (
                <button
                  type="button"
                  onClick={() => remove(message)}
                  aria-label="Delete message"
                  className="mb-1 rounded p-1 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          );
        })}
        <li ref={bottomRef} aria-hidden />
      </ol>

      <form onSubmit={send} className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Message…"
            aria-label="Message"
            className="max-h-32 flex-1 resize-none rounded-2xl border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="rounded-full bg-blue-600 p-2 text-white disabled:opacity-40"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
