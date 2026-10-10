"use client";

import type { StoryGroup } from "@/interfaces/api";
import { deleteStory } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import { markStorySeen } from "@/lib/seen-stories";
import { Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "./avatar";

const DURATION_MS = 5000;
const HOLD_MS = 250; // pressing longer than this pauses instead of skipping

interface Props {
  groups: StoryGroup[];
  startIndex: number;
  meId: string;
}

export function StoryViewer({ groups: initialGroups, startIndex, meId }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [position, setPosition] = useState({ group: startIndex, story: 0 });
  const [paused, setPaused] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const pressedAt = useRef(0);

  // Next.js keeps visited pages alive in the background (React <Activity>) and restores
  // their state when you come back. A story viewer should always start at the person
  // you tapped, so reset when the page is hidden.
  useLayoutEffect(() => {
    return () => {
      setGroups(initialGroups);
      setPosition({ group: startIndex, story: 0 });
      setPaused(false);
    };
  }, [initialGroups, startIndex]);

  const group = groups[position.group];
  const story = group?.stories[position.story];

  const close = useCallback(() => router.push("/"), [router]);

  const next = useCallback(() => {
    const { group: g, story: s } = position;
    if (s < groups[g].stories.length - 1) setPosition({ group: g, story: s + 1 });
    else if (g < groups.length - 1) setPosition({ group: g + 1, story: 0 });
    else close(); // that was the last story
  }, [position, groups, close]);

  const prev = useCallback(() => {
    const { group: g, story: s } = position;
    if (s > 0) setPosition({ group: g, story: s - 1 });
    else if (g > 0) setPosition({ group: g - 1, story: groups[g - 1].stories.length - 1 });
  }, [position, groups]);

  // Remember what you've watched (greys out the ring in the stories bar)
  useEffect(() => {
    if (story) markStorySeen(story.id);
  }, [story]);

  // Keyboard: ← → to move, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close]);

  if (!group || !story) return null;
  const isMine = group.author.id === meId;
  const originalAuthor = story.post.author && story.post.author.id !== group.author.id ? story.post.author : null;
  const image = story.post.images[0];

  // A tap moves; a press-and-hold only pauses
  const pressStart = () => {
    pressedAt.current = Date.now();
    setPaused(true);
  };
  const pressEnd = (move: () => void) => () => {
    setPaused(false);
    if (Date.now() - pressedAt.current < HOLD_MS) move();
  };

  function remove() {
    const storyId = story.id;
    startDeleting(async () => {
      await deleteStory(storyId);
      // Drop it locally and stay in place (or move on if that was the last one)
      const remaining = groups
        .map((g) => ({ ...g, stories: g.stories.filter((s) => s.id !== storyId) }))
        .filter((g) => g.stories.length > 0);
      if (remaining.length === 0) return close();
      const groupIndex = Math.min(position.group, remaining.length - 1);
      setGroups(remaining);
      setPosition({ group: groupIndex, story: Math.min(position.story, remaining[groupIndex].stories.length - 1) });
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stories"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="relative h-full max-h-[56rem] w-full max-w-md overflow-hidden bg-neutral-900 sm:rounded-xl">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- full-screen story image from the API's media route
          <img
            src={image}
            alt={story.post.caption || `Story by ${group.author.username}`}
            className="absolute inset-0 size-full object-contain"
          />
        )}

        {/* Progress: one bar per story; the current one fills over DURATION_MS, then moves on */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              {i < position.story && <div className="h-full w-full bg-white" />}
              {i === position.story && (
                <div
                  key={`${s.id}-${position.group}`}
                  data-testid="story-progress"
                  className="h-full bg-white"
                  onAnimationEnd={next}
                  style={{
                    animation: `story-progress ${DURATION_MS}ms linear forwards`,
                    animationPlayState: paused || deleting ? "paused" : "running",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <header className="absolute inset-x-0 top-3 z-10 flex items-center gap-2 px-3 pt-2 text-white">
          <Avatar user={group.author} size="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2">
              <Link href={`/users/${group.author.id}`} className="text-sm font-semibold hover:underline">
                {group.author.username}
              </Link>
              <time dateTime={story.createdAt} className="text-xs text-white/70">
                {timeAgo(story.createdAt)}
              </time>
            </span>
            {/* A shared post: credit whoever originally posted it */}
            {originalAuthor && (
              <Link
                href={`/users/${originalAuthor.id}`}
                className="truncate text-xs text-white/80 hover:underline"
                data-testid="story-credit"
              >
                from @{originalAuthor.username}
              </Link>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1">
            {isMine && (
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                aria-label="Delete story"
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Trash2 className="size-5" />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close stories"
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {/* Tap the left third to go back, the rest to go forward */}
        <button
          type="button"
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 z-0 w-1/3"
          onPointerDown={pressStart}
          onPointerUp={pressEnd(prev)}
          onPointerLeave={() => setPaused(false)}
        />
        <button
          type="button"
          aria-label="Next story"
          className="absolute inset-y-0 right-0 z-0 w-2/3"
          onPointerDown={pressStart}
          onPointerUp={pressEnd(next)}
          onPointerLeave={() => setPaused(false)}
        />

        <footer className="absolute inset-x-0 bottom-0 z-10 space-y-1 bg-linear-to-t from-black/70 to-transparent p-4 text-white">
          {story.post.caption && <p className="text-sm">{story.post.caption}</p>}
          <Link href={`/posts/${story.post.id}`} className="text-xs text-white/80 underline">
            View post
          </Link>
        </footer>
      </div>
    </div>
  );
}
