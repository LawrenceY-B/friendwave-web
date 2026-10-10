"use client";

import type { StoryGroup } from "@/interfaces/api";
import { useSeenStories } from "@/lib/seen-stories";
import Link from "next/link";
import { Avatar } from "./avatar";

// The row of people with live stories at the top of the feed.
// A coloured ring means "something new"; grey means you've seen it all.
export function StoriesBar({ groups, meId }: { groups: StoryGroup[]; meId: string }) {
  const seen = useSeenStories();

  if (groups.length === 0) return null;
  return (
    <nav aria-label="Stories" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-4">
        {groups.map((group) => {
          const author = group.author;
          const allSeen = seen !== null && group.stories.every((s) => seen.has(s.id));
          return (
            <li key={author.id}>
              <Link href={`/stories?start=${author.id}`} className="flex w-16 flex-col items-center gap-1">
                <span
                  className={`rounded-full p-0.5 ${
                    allSeen
                      ? "bg-neutral-300 dark:bg-neutral-700"
                      : "bg-linear-to-tr from-amber-400 via-pink-500 to-purple-600"
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
