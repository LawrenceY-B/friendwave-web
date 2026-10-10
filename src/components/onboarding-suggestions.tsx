"use client";

import type { Suggestion } from "@/interfaces/api";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Avatar } from "./avatar";
import { FollowButton } from "./follow-button";
import { reason } from "./suggestions";

// A new user's empty feed: follow as many people as you like, then "Show my feed".
// The feed page re-renders on the server as you follow people (it may start returning their
// posts straight away), so <FeedGate> keeps this on screen until you choose to continue.
export function FeedGate({
  startEmpty,
  suggestions,
  children,
}: {
  startEmpty: boolean; // the feed was empty when you arrived
  suggestions: Suggestion[];
  children: React.ReactNode; // the feed as the server currently renders it
}) {
  const router = useRouter();
  // Captured on arrival: later server renders don't switch it off (or swap the list) mid-pick
  const [onboarding, setOnboarding] = useState(startEmpty && suggestions.length > 0);
  const [list] = useState(suggestions);
  const [loading, startLoading] = useTransition();
  if (!onboarding) return children;
  return (
    <OnboardingSuggestions
      suggestions={list}
      loading={loading}
      onDone={() =>
        startLoading(() => {
          setOnboarding(false);
          router.refresh(); // the freshest feed, with everyone you just followed
        })
      }
    />
  );
}

function OnboardingSuggestions({
  suggestions,
  loading,
  onDone,
}: {
  suggestions: Suggestion[];
  loading: boolean;
  onDone: () => void;
}) {
  const [followed, setFollowed] = useState<ReadonlySet<string>>(new Set());
  const cta = useRef<HTMLButtonElement>(null);
  const count = followed.size;

  // The button springs to life with the first follow
  useGSAP(
    () => {
      if (count > 0 && !reducedMotion())
        gsap.fromTo(
          cta.current,
          { scale: 0.85, y: 10 },
          { scale: 1, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }
        );
    },
    { dependencies: [count > 0] }
  );

  const track = (id: string) => (following: boolean) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      if (following) next.add(id);
      else next.delete(id);
      return next;
    });

  if (suggestions.length === 0) return null;
  return (
    <section aria-label="Suggested for you" className="space-y-3">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">Welcome to Friendwave 👋</h2>
        <p className="text-sm text-neutral-500">Follow a few people to fill your feed</p>
        <Link href="/search" className="text-sm text-blue-600 hover:underline">
          Find people to follow
        </Link>
      </div>
      <ul className="-mx-3">
        {suggestions.map((s) => (
          <li key={s.id} data-reveal className="flex items-center gap-3 p-3">
            <Link href={`/users/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={s} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.username}</span>
                <span className="block truncate text-xs text-neutral-500">{reason(s)}</span>
              </span>
            </Link>
            <FollowButton userId={s.id} isFollowing={false} refresh={false} onChange={track(s.id)} />
          </li>
        ))}
      </ul>
      {/* Stays in reach above the bottom bar while you scroll the list */}
      <div className="sticky bottom-24 z-10 flex justify-center pt-2 sm:bottom-4">
        <button
          ref={cta}
          type="button"
          disabled={count === 0 || loading}
          onClick={onDone}
          className="rounded-full bg-linear-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 disabled:bg-neutral-300 disabled:bg-none disabled:text-neutral-600 disabled:shadow-none dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400"
        >
          {loading
            ? "Loading your feed…"
            : count === 0
              ? "Follow someone to continue"
              : `Following ${count} · Show my feed`}
        </button>
      </div>
    </section>
  );
}
