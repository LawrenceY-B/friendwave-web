"use client";

import type { Comment } from "@/interfaces/api";
import { addComment, addReply, loadComments, removeComment, removeReply } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { Avatar } from "./avatar";

interface Props {
  postId: string;
  postAuthorId: string | null;
  meId: string;
  comments: Comment[]; // first page, newest first (re-rendered by the server after each change)
  nextCursor: string | null;
}

export function Comments({ postId, postAuthorId, meId, comments, nextCursor }: Props) {
  // Older pages loaded with "Load older comments" are kept here, below the server's first page
  const [older, setOlder] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState(nextCursor);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const seen = new Set(comments.map((c) => c.id));
  const shown = [...comments, ...older.filter((c) => !seen.has(c.id))];

  // Runs a Server Action; the server re-renders this page with the result
  const run = (action: () => Promise<unknown>, onDone?: () => void) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        onDone?.();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    run(
      () => addComment(postId, text),
      () => setText("")
    );
  };

  const submitReply = (event: FormEvent, commentId: string) => {
    event.preventDefault();
    if (!replyText.trim()) return;
    run(
      () => addReply(postId, commentId, replyText),
      () => {
        setReplyText("");
        setReplyingTo(null);
      }
    );
  };

  const deleteComment = (commentId: string) =>
    run(
      () => removeComment(postId, commentId),
      () => setOlder((prev) => prev.filter((c) => c.id !== commentId))
    );

  const loadOlder = () =>
    cursor &&
    run(async () => {
      const page = await loadComments(postId, cursor);
      setOlder((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    });

  return (
    <section aria-label="Comments" className="space-y-4">
      <form onSubmit={submitComment} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          className="flex-1 rounded-full border border-neutral-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="rounded-full px-3 text-sm font-semibold text-blue-600 disabled:opacity-40"
        >
          Post
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {shown.length === 0 && <p className="py-6 text-center text-sm text-neutral-500">No comments yet.</p>}

      <ul className="space-y-4">
        {shown.map((comment) => {
          const canDelete = comment.author?.id === meId || postAuthorId === meId;
          return (
            <li key={comment.id} className="space-y-2">
              <div className="group flex gap-3">
                <Avatar user={comment.author} size="sm" />
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <AuthorLink comment={comment} /> <span className="whitespace-pre-wrap">{comment.text}</span>
                  </p>
                  <p className="mt-1 flex gap-3 text-xs text-neutral-500">
                    <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="font-semibold hover:underline"
                    >
                      Reply
                    </button>
                  </p>
                </div>
                {canDelete && (
                  <DeleteButton label="Delete comment" disabled={pending} onClick={() => deleteComment(comment.id)} />
                )}
              </div>

              {comment.replies.length > 0 && (
                <ul className="ml-11 space-y-2">
                  {comment.replies.map((reply) => (
                    <li key={reply.id} className="group flex gap-3 text-sm">
                      <Avatar user={reply.author} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p>
                          <AuthorLink comment={reply} /> <span className="whitespace-pre-wrap">{reply.text}</span>
                        </p>
                        <time dateTime={reply.createdAt} className="text-xs text-neutral-500">
                          {timeAgo(reply.createdAt)}
                        </time>
                      </div>
                      {(reply.author?.id === meId || comment.author?.id === meId) && (
                        <DeleteButton
                          label="Delete reply"
                          disabled={pending}
                          onClick={() => run(() => removeReply(postId, comment.id, reply.id))}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {replyingTo === comment.id && (
                <form onSubmit={(e) => submitReply(e, comment.id)} className="ml-11 flex gap-2">
                  <input
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={500}
                    placeholder={`Reply to ${comment.author?.username ?? "comment"}…`}
                    aria-label="Write a reply"
                    className="flex-1 rounded-full border border-neutral-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
                  />
                  <button
                    type="submit"
                    disabled={pending || !replyText.trim()}
                    className="text-sm font-semibold text-blue-600 disabled:opacity-40"
                  >
                    Reply
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {cursor && (
        <button type="button" onClick={loadOlder} disabled={pending} className="text-sm text-blue-600 hover:underline">
          Load older comments
        </button>
      )}
    </section>
  );
}

function AuthorLink({ comment }: { comment: { author: Comment["author"] } }) {
  return comment.author ? (
    <Link href={`/users/${comment.author.id}`} className="font-semibold hover:underline">
      {comment.author.username}
    </Link>
  ) : (
    <span className="text-neutral-500">Deleted user</span>
  );
}

function DeleteButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="self-start p-1 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-500 focus:opacity-100"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
