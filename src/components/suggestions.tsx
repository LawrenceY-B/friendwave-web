import type { Suggestion } from "@/interfaces/api";
import Link from "next/link";
import { Avatar } from "./avatar";
import { FollowButton } from "./follow-button";

// "Followed by alice and 2 others", or a generic line when there are no mutuals
function reason(s: Suggestion) {
  if (s.mutualCount === 0 || s.followedBy.length === 0) return "Suggested for you";
  const others = s.mutualCount - s.followedBy.length;
  const names = s.followedBy.join(" and ");
  return others > 0
    ? `Followed by ${s.followedBy[0]} and ${s.mutualCount - 1} other${s.mutualCount - 1 === 1 ? "" : "s"}`
    : `Followed by ${names}`;
}

// People to follow (from GET /api/users/suggestions)
export function Suggestions({
  suggestions,
  title = "Suggested for you",
}: {
  suggestions: Suggestion[];
  title?: string;
}) {
  if (suggestions.length === 0) return null;
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-center gap-3 p-3">
            <Link href={`/users/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={s} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.username}</span>
                <span className="block truncate text-xs text-neutral-500">{reason(s)}</span>
              </span>
            </Link>
            <FollowButton key={s.id} userId={s.id} isFollowing={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
