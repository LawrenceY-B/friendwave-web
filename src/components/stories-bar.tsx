"use client";

import type { StoryGroup } from "@/interfaces/api";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { useSeenStories } from "@/lib/seen-stories";
import Link from "next/link";
import { useRef } from "react";
import { Avatar } from "./avatar";

// The row of people with live stories at the top of the feed.
// A coloured ring means "something new"; grey means you've seen it all.
export function StoriesBar({ groups, meId }: { groups: StoryGroup[]; meId: string }) {
  const seen = useSeenStories();
  const bar = useRef<HTMLElement>(null);

  // The bubbles pop in one after another; unseen rings slowly spin their colours
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from("li", { scale: 0.4, opacity: 0, y: 10, duration: 0.6, stagger: 0.06, ease: "back.out(2.2)" });
      gsap.to("[data-ring='new']", { "--ring-angle": "360deg", duration: 3.5, ease: "none", repeat: -1 });
    },
    { scope: bar, dependencies: [groups.length, seen?.size], revertOnUpdate: true }
  );

  if (groups.length === 0) return null;
  return (
    <nav ref={bar} data-lenis-prevent-horizontal aria-label="Stories" className="-mx-4 overflow-x-auto px-4 py-1">
      <ul className="flex gap-4">
        {groups.map((group) => {
          const author = group.author;
          const allSeen = seen !== null && group.stories.every((s) => seen.has(s.id));
          return (
            <li key={author.id}>
              <Link href={`/stories?start=${author.id}`} className="flex w-16 flex-col items-center gap-1">
                <span
                  data-ring={allSeen ? "seen" : "new"}
                  className={`rounded-full p-0.5 transition-transform active:scale-90 ${
                    allSeen ? "bg-neutral-300 dark:bg-neutral-700" : "story-ring"
                  }`}
                >
                  <span className="block rounded-full bg-neutral-50 p-0.5 dark:bg-black">
                    <Avatar user={author} />
                  </span>
                </span>
                <span className="w-full truncate text-center text-xs">
                  {author.id === meId ? "Your story" : author.username}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
