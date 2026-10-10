"use client";

import type { StoryGroup } from "@/interfaces/api";
import { deleteStory } from "@/lib/actions";
import { timeAgo } from "@/lib/format";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { markStorySeen } from "@/lib/seen-stories";
import { ChevronRight, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "./avatar";
import { useBack } from "./navigation-tracker";
import { useScrollLock } from "./smooth-scroll";

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
  // The story whose "See post" bubble is showing (tap the post to show it)
  const [bubbleFor, setBubbleFor] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();
  // "See post" opens the post on top of the stories; they wait underneath until it's closed
  const hidden = usePathname() !== "/stories";
  const pressedAt = useRef(0);
  const direction = useRef(1); // 1 = forward, -1 = back: which way the next story swings in

  // Next.js keeps visited pages alive in the background (React <Activity>) and restores
  // their state when you come back. A story viewer should always start at the person
  // you tapped, so reset when the page is hidden.
  useLayoutEffect(() => {
    return () => {
      setGroups(initialGroups);
      setPosition({ group: startIndex, story: 0 });
      setPaused(false);
      setBubbleFor(null);
    };
  }, [initialGroups, startIndex]);

  const group = groups[position.group];
  const story = group?.stories[position.story];

  // Back to wherever the stories were opened from (feed, a profile's ring); the feed if
  // there's no in-app page behind (opened from a link)
  const close = useBack("/");

  const next = useCallback(() => {
    direction.current = 1;
    const { group: g, story: s } = position;
    if (s < groups[g].stories.length - 1) setPosition({ group: g, story: s + 1 });
    else if (g < groups.length - 1) setPosition({ group: g + 1, story: 0 });
    else close(); // that was the last story
  }, [position, groups, close]);

  const prev = useCallback(() => {
    direction.current = -1;
    const { group: g, story: s } = position;
    if (s > 0) setPosition({ group: g, story: s - 1 });
    else if (g > 0) setPosition({ group: g - 1, story: groups[g - 1].stories.length - 1 });
  }, [position, groups]);

  // Remember what you've watched (greys out the ring in the stories bar)
  useEffect(() => {
    if (story) markStorySeen(story.id);
  }, [story]);

  // Keyboard: ← → to move, Esc to close the bubble, then the stories
  useEffect(() => {
    if (hidden) return; // the post on top has the keyboard
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bubbleFor) setBubbleFor(null);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close, hidden, bubbleFor]);

  // ---- motion ----
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLImageElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);
  useScrollLock(!hidden);

  // Opening: the stories open out of a circle in the middle, like a portal
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(
      root.current,
      { clipPath: "circle(0% at 50% 50%)" },
      { clipPath: "circle(150% at 50% 50%)", duration: 0.7, ease: "power3.inOut", clearProps: "clipPath" }
    );
  });

  // Each story: the post swings in in 3D from the side you're heading to; the blurred backdrop cross-fades
  const storyId = story?.id;
  useGSAP(
    () => {
      if (!storyId || reducedMotion()) return;
      const d = direction.current;
      gsap.fromTo(
        card.current,
        { opacity: 0, xPercent: 35 * d, rotationY: -40 * d, scale: 0.85, transformPerspective: 1000 },
        { opacity: 1, xPercent: 0, rotationY: 0, scale: 1, duration: 0.6, ease: "power3.out", clearProps: "transform" }
      );
      gsap.fromTo(backdrop.current, { opacity: 0, scale: 1.3 }, { opacity: 0.5, scale: 1.1, duration: 0.9 });
    },
    { dependencies: [storyId] }
  );

  // "See post" springs out of the card
  useGSAP(
    () => {
      if (!bubbleFor || reducedMotion()) return;
      gsap.fromTo(
        bubble.current,
        { scale: 0, rotation: -12, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: "elastic.out(1.1, 0.45)" }
      );
    },
    { dependencies: [bubbleFor] }
  );

  if (!group || !story) return null;
  const isMine = group.author.id === meId;
  const originalAuthor = story.post.author && story.post.author.id !== group.author.id ? story.post.author : null;
  const image = story.post.images[0];
  const bubbleOpen = bubbleFor === story.id;

  // A tap moves; a press-and-hold only pauses. With the bubble open, a tap anywhere else just
  // dismisses it.
  const pressStart = () => {
    pressedAt.current = Date.now();
    setPaused(true);
  };
  const pressEnd = (move: () => void) => {
    setPaused(false);
    if (Date.now() - pressedAt.current >= HOLD_MS) return;
    if (bubbleOpen) setBubbleFor(null);
    else move();
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
      ref={root}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Stories"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="relative h-full max-h-[56rem] w-full max-w-md overflow-hidden bg-neutral-900 sm:rounded-xl">
        {image && (
          <>
            {/* Blurred backdrop of the same photo */}
            {/* eslint-disable-next-line @next/next/no-img-element -- story image from the API's media route */}
            <img
              ref={backdrop}
              src={image}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
            />
            {/* The post as a card in the middle, above the tap areas: tapping it offers "See post" */}
            <div ref={card} className="absolute inset-x-6 top-1/2 z-10 -translate-y-1/2">
              <button
                type="button"
                // Like the rest of the story: hold to pause; a tap toggles the bubble
                onPointerDown={pressStart}
                onPointerUp={() => pressEnd(() => setBubbleFor(story.id))}
                onPointerLeave={() => setPaused(false)}
                // Keyboard (Enter/Space) has no pointer events
                onClick={(e) => e.detail === 0 && setBubbleFor(bubbleOpen ? null : story.id)}
                aria-expanded={bubbleOpen}
                aria-label="Show post options"
                className="block w-full overflow-hidden rounded-xl shadow-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- story image from the API's media route */}
                <img
                  src={image}
                  alt={story.post.caption || `Story by ${group.author.username}`}
                  className="max-h-[60vh] w-full object-cover"
                />
              </button>
              {bubbleOpen && (
                <button
                  ref={bubble}
                  type="button"
                  onClick={() => {
                    setBubbleFor(null); // gone when you come back to the story
                    router.push(`/posts/${story.post.id}`);
                  }}
                  className="absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg"
                >
                  See post
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </>
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
                    animationPlayState: paused || deleting || bubbleOpen || hidden ? "paused" : "running",
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
              <time suppressHydrationWarning dateTime={story.createdAt} className="text-xs text-white/70">
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
          onPointerUp={() => pressEnd(prev)}
          onPointerLeave={() => setPaused(false)}
        />
        <button
          type="button"
          aria-label="Next story"
          className="absolute inset-y-0 right-0 z-0 w-2/3"
          onPointerDown={pressStart}
          onPointerUp={() => pressEnd(next)}
          onPointerLeave={() => setPaused(false)}
        />

        {story.post.caption && (
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 to-transparent p-4 text-white">
            <p className="text-sm">{story.post.caption}</p>
          </footer>
        )}
      </div>
    </div>
  );
}
