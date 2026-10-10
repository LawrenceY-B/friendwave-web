"use client";

import type { Chat, Message } from "@/interfaces/api";
import { deleteMessage, loadMessages, sendMessage } from "@/lib/actions";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { ArrowLeft, Check, ChevronDown, Clock3, SendHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { Avatar } from "./avatar";
import { usePresence, useRealtime, useSocketEvent } from "./realtime-provider";
import { useScrollLock } from "./smooth-scroll";

const GROUP_GAP_MS = 5 * 60 * 1000; // same sender within 5 minutes: one group of bubbles
const NEAR_BOTTOM_PX = 300; // further up than this shows the "jump to latest" button

// True only in the browser after hydration. Dates depend on the viewer's timezone, so
// anything day-based renders after that, keeping server and browser HTML identical.
const noSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );

const dayKey = (date: string) => new Date(date).toDateString();
function dayLabel(date: string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    ...(d.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }),
  });
}

// 1–3 emoji and nothing else: shown big, without a bubble
const graphemes =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
function isEmojiOnly(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 40 || !graphemes) return false;
  const parts = [...graphemes.segment(trimmed)].map((g) => g.segment).filter((g) => g.trim());
  return parts.length <= 3 && parts.every((g) => /\p{Extended_Pictographic}/u.test(g) && !/[\p{L}\p{N}]/u.test(g));
}

type UiMessage = Message & { pending?: boolean };

// Adds a message, or replaces the one with the same id, keeping oldest → newest order.
// The same message can arrive twice (the send acknowledgement AND the live
// "message:new" event), so everything goes through here to avoid duplicates.
function upsert(list: UiMessage[], message: UiMessage): UiMessage[] {
  const index = list.findIndex((m) => m.id === message.id);
  if (index >= 0) return list.map((m, i) => (i === index ? message : m));
  return [...list, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const timeOf = (date: string) => new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

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

  // ---- full screen, Telegram-style ----
  useScrollLock(); // the page underneath stays put
  const mounted = useMounted();
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const jump = useRef<HTMLButtonElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const canSend = draft.trim().length > 0;

  // Their new messages while you're scrolled up: count them on the ⌄ button
  useSocketEvent<Message>("message:new", (message) => {
    if (message.chatId === chat.id && message.senderId !== meId && !nearBottom.current) setUnseen((n) => n + 1);
  });

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottom.current = distance < 120;
    setShowJump(distance > NEAR_BOTTOM_PX);
    if (distance < 40) setUnseen(0);
  };

  // (Braces on purpose: newer browsers return a Promise from scrollTo, and an effect must
  // never return anything but a cleanup function)
  const toBottom = (smooth = true) => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  };

  // A newly arrived last message: follow it if you were at the bottom (or sent it), and pop it in
  const previousLast = useRef<UiMessage | undefined>(undefined);
  useEffect(() => {
    const last = messages.at(-1);
    const before = previousLast.current;
    previousLast.current = last;
    if (!last || last.id === before?.id) return;
    if (!before) {
      toBottom(false); // first render: start at the latest
      return;
    }
    const mine = last.senderId === meId;
    if (mine || nearBottom.current) toBottom();
    // Your sent message swapping in for its "sending" copy isn't a new arrival
    const swapped = mine && before.id.startsWith("temp-") && !last.id.startsWith("temp-");
    const row = scroller.current?.querySelector(`[data-id="${last.id}"]`);
    if (!row || swapped || reducedMotion()) return;
    gsap.fromTo(
      row,
      { opacity: 0, scale: 0.85, y: 14, transformOrigin: mine ? "100% 100%" : "0% 100%" },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(2)", clearProps: "transform,opacity" }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the list changes
  }, [messages]);

  // Loading older messages adds them above: keep what you were reading in place
  const heightBeforeOlder = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && heightBeforeOlder.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    }
  }, [messages]);
  const showOlder = () => {
    heightBeforeOlder.current = scroller.current?.scrollHeight ?? null;
    loadOlder();
  };

  // The message box grows with what you type (up to ~5 lines)
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  // Springy entrances: the ⌄ button, and Send when there's something to send
  useGSAP(
    () => {
      if (showJump && !reducedMotion())
        gsap.fromTo(
          jump.current,
          { scale: 0, rotation: -90 },
          { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.5)" }
        );
    },
    { dependencies: [showJump] }
  );
  useGSAP(
    () => {
      if (canSend && !reducedMotion())
        gsap.fromTo(
          sendButton.current,
          { scale: 0.6, rotation: -30 },
          { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(3)" }
        );
    },
    { dependencies: [canSend] }
  );

  // Your own connection being down matters most; then whether they're here (no last-seen time in the API)
  const statusText =
    socket && status === "offline" ? "Reconnecting…" : otherOnline ? "online" : other ? "last seen recently" : "";

  const glass = "bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-md dark:bg-neutral-900/70 dark:ring-white/10";
  const pill = "rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm dark:bg-white/15";

  return (
    <div className="chat-wallpaper fixed inset-0 z-40 text-neutral-900 dark:text-neutral-100">
      {/* Floating header: back · name + status · picture */}
      <header className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
        <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr_auto] items-center gap-2">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${glass} active:scale-90`}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className={`max-w-full min-w-0 justify-self-center rounded-full px-6 py-1.5 text-center ${glass}`}>
            {other ? (
              <Link href={`/users/${other.id}`} className="block truncate text-sm font-semibold hover:underline">
                {other.username}
              </Link>
            ) : (
              <span className="block text-sm text-neutral-500">Deleted user</span>
            )}
            <span
              aria-live="polite"
              className={`block text-xs ${statusText === "online" ? "text-blue-600 dark:text-blue-400" : "text-neutral-500"}`}
            >
              {statusText}
            </span>
          </div>
          {other ? (
            <Link href={`/users/${other.id}`} aria-label={`${other.username}'s profile`} className="shrink-0">
              <Avatar user={other} online={otherOnline} />
            </Link>
          ) : (
            <Avatar user={null} />
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} data-lenis-prevent className="absolute inset-0 overflow-y-auto">
        <ol aria-label="Messages" className="mx-auto flex max-w-xl flex-col px-3 pt-20 pb-28">
          {cursor && (
            <li className="mb-2 flex justify-center">
              <button type="button" onClick={showOlder} disabled={loadingOlder} className={`${pill} hover:bg-black/35`}>
                {loadingOlder ? "Loading…" : "Load older messages"}
              </button>
            </li>
          )}
          {messages.length === 0 && (
            <li className="flex justify-center py-10">
              <span className={pill}>No messages yet. Say hi 👋</span>
            </li>
          )}
          {messages.map((message, i) => {
            const mine = message.senderId === meId;
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const sameGroup = (a?: UiMessage, b?: UiMessage) =>
              !!a &&
              !!b &&
              a.senderId === b.senderId &&
              !isEmojiOnly(a.text) && // big emoji stand alone, like Telegram
              !isEmojiOnly(b.text) &&
              Math.abs(Date.parse(b.createdAt) - Date.parse(a.createdAt)) < GROUP_GAP_MS &&
              (!mounted || dayKey(a.createdAt) === dayKey(b.createdAt));
            const newDay = mounted && (!prev || dayKey(prev.createdAt) !== dayKey(message.createdAt));
            const first = !sameGroup(prev, message) || newDay;
            const last =
              !sameGroup(message, next) || (mounted && !!next && dayKey(next.createdAt) !== dayKey(message.createdAt));
            const emoji = isEmojiOnly(message.text);
            const meta = (
              <>
                {message.editedAt && <span>edited</span>}
                <time suppressHydrationWarning dateTime={message.createdAt}>
                  {timeOf(message.createdAt)}
                </time>
                {mine &&
                  (message.pending ? (
                    <>
                      <Clock3 aria-hidden className="size-3" />
                      <span className="sr-only">Sending…</span>
                    </>
                  ) : (
                    <Check aria-label="Sent" className="size-3.5" />
                  ))}
              </>
            );
            return (
              <MessageRow key={message.id}>
                {newDay && (
                  <li className="pointer-events-none sticky top-[4.75rem] z-10 my-2 flex justify-center">
                    <span className={pill}>{dayLabel(message.createdAt)}</span>
                  </li>
                )}
                <li
                  data-id={message.id}
                  data-mine={mine || undefined}
                  className={`group flex items-end gap-1 ${mine ? "justify-end" : "justify-start"} ${first ? "mt-2" : "mt-0.5"}`}
                >
                  {mine && !message.pending && (
                    <button
                      type="button"
                      onClick={() => remove(message)}
                      aria-label="Delete message"
                      className="mb-1 rounded-full bg-white/70 p-1.5 text-neutral-500 opacity-0 backdrop-blur group-hover:opacity-100 hover:text-red-500 focus:opacity-100 dark:bg-neutral-900/70"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  {emoji ? (
                    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`} data-testid="emoji-message">
                      <span className="text-5xl leading-tight">{message.text.trim()}</span>
                      <span className={`mt-0.5 inline-flex items-center gap-1 ${pill} py-0.5 text-[11px]`}>{meta}</span>
                    </div>
                  ) : (
                    <div
                      data-testid="bubble"
                      className={`relative max-w-[78%] rounded-2xl px-3 py-1.5 text-[15px] leading-snug shadow-sm ${
                        mine
                          ? "bg-blue-100 text-neutral-900 dark:bg-blue-600 dark:text-white"
                          : "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                      } ${last ? (mine ? "rounded-br-md" : "rounded-bl-md") : ""} ${message.pending ? "opacity-70" : ""}`}
                    >
                      <span className="break-words whitespace-pre-wrap">{message.text}</span>
                      {/* Time (and tick) tucked into the bottom-right corner, Telegram-style */}
                      <span
                        className={`relative top-1.5 float-right ml-2 inline-flex items-center gap-1 text-[11px] ${
                          mine ? "text-blue-700/70 dark:text-blue-100/80" : "text-neutral-400"
                        }`}
                      >
                        {meta}
                      </span>
                      {last && <Tail mine={mine} />}
                    </div>
                  )}
                </li>
              </MessageRow>
            );
          })}
        </ol>
      </div>

      {/* Jump to the latest */}
      {showJump && (
        <button
          ref={jump}
          type="button"
          onClick={() => {
            toBottom();
            setUnseen(0);
          }}
          aria-label={unseen > 0 ? `${unseen} new, jump to latest` : "Jump to latest"}
          className={`absolute right-[max(0.75rem,calc(50%-18rem+0.75rem))] bottom-24 z-20 flex size-11 items-center justify-center rounded-full ${glass}`}
        >
          <ChevronDown className="size-5" />
          {unseen > 0 && (
            <span
              data-testid="unseen-badge"
              className="absolute -top-1.5 -right-1 min-w-5 rounded-full bg-linear-to-r from-blue-600 to-violet-600 px-1.5 text-center text-[11px] leading-5 font-semibold text-white"
            >
              {unseen}
            </span>
          )}
        </button>
      )}

      {/* Floating message box */}
      <form
        onSubmit={send}
        className="absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div className="mx-auto max-w-xl">
          {error && (
            <p role="alert" className="mb-2 flex justify-center">
              <span className="rounded-full bg-red-600/90 px-3 py-1 text-xs text-white">{error}</span>
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Message"
              aria-label="Message"
              className={`max-h-36 min-h-11 flex-1 resize-none rounded-3xl px-4 py-2.5 text-[15px] outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500/40 ${glass}`}
            />
            <button
              ref={sendButton}
              type="submit"
              disabled={!canSend}
              aria-label="Send"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30 transition-opacity active:scale-90 disabled:opacity-40 disabled:shadow-none"
            >
              <SendHorizontal className="size-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Lets a message bring its date pill along (two <li>s, one key)
function MessageRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// The little hook on the last bubble of a group, in the bubble's own colour
function Tail({ mine }: { mine: boolean }) {
  return (
    <svg
      aria-hidden
      data-tail
      viewBox="0 0 11 16"
      className={`absolute bottom-0 h-4 w-[11px] ${
        mine
          ? "-right-[6px] text-blue-100 dark:text-blue-600"
          : "-left-[6px] -scale-x-100 text-white dark:text-neutral-800"
      }`}
    >
      <path d="M0 0C0 8 3 13 11 16H0Z" fill="currentColor" />
    </svg>
  );
}
