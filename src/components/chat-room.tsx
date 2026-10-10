"use client";

import type { Chat, Message } from "@/interfaces/api";
import { deleteMessage, loadMessages, sendMessage } from "@/lib/actions";
import { connectSocket } from "@/lib/socket";
import { ArrowLeft, SendHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import type { Socket } from "socket.io-client";
import { Avatar } from "./avatar";

type UiMessage = Message & { pending?: boolean };
type Status = "connecting" | "live" | "offline";

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
  const [status, setStatus] = useState<Status>("connecting");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingOlder, startLoadingOlder] = useTransition();
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLLIElement>(null);
  const lastIdRef = useRef<string | undefined>(undefined);
  const connectedBefore = useRef(false);
  const other = chat.participants[0] ?? null;

  // ---- live connection ----
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;
    socket.on("connect", async () => {
      setStatus("live");
      // Catch up on anything sent while we weren't connected: after a dropped
      // connection, or after coming back to this page (Next.js keeps it alive in
      // the background, but its socket is closed while hidden)
      if (connectedBefore.current) {
        const latest = await loadMessages(chat.id).catch(() => null);
        if (latest) setMessages((prev) => latest.items.reduce(upsert, prev));
      }
      connectedBefore.current = true;
    });
    const goOffline = () => setStatus("offline");
    socket.on("disconnect", goOffline);
    socket.on("connect_error", goOffline);

    socket.on("message:new", (message: Message) => {
      if (message.chatId === chat.id) setMessages((prev) => upsert(prev, message));
    });
    socket.on("message:updated", (message: Message) => {
      if (message.chatId === chat.id) setMessages((prev) => upsert(prev, message));
    });
    socket.on("message:deleted", ({ id, chatId }: { id: string; chatId: string }) => {
      if (chatId === chat.id) setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    // Leaving the page closes the connection
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chat.id]);

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
      const socket = socketRef.current;
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
        <Avatar user={other} size="sm" />
        {other ? (
          <Link href={`/users/${other.id}`} className="font-semibold hover:underline">
            {other.username}
          </Link>
        ) : (
          <span className="text-neutral-500">Deleted user</span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500" aria-live="polite">
          <span
            className={`size-2 rounded-full ${status === "live" ? "bg-green-500" : status === "offline" ? "bg-red-500" : "bg-amber-400"}`}
          />
          {status === "live" ? "Live" : status === "offline" ? "Reconnecting…" : "Connecting…"}
        </span>
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
