import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { RecentSearches, SearchResultLink } from "@/components/recent-searches";
import { SearchBox } from "@/components/search-box";
import { Suggestions } from "@/components/suggestions";
import type { Suggestion, UserSearchResult } from "@/interfaces/api";
import { api, apiPage } from "@/lib/api";
import Link from "next/link";
import { Suspense } from "react";

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="space-y-4">
      {/* useSearchParams reads the URL at request time, so it needs a boundary too */}
      <Suspense fallback={<div className="h-10 rounded-full bg-neutral-200 dark:bg-neutral-900" />}>
        <SearchBox />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const { q, cursor } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 50) : "";
  if (!query) {
    // Nothing typed yet: recent searches (this browser) and people to follow
    const suggestions = await api<Suggestion[]>("/api/users/suggestions?limit=10");
    return (
      <div className="space-y-6">
        <RecentSearches />
        <Suggestions suggestions={suggestions} />
      </div>
    );
  }

  const after = typeof cursor === "string" && /^[0-9a-f]{24}$/.test(cursor) ? `&cursor=${cursor}` : "";
  const { items, nextCursor } = await apiPage<UserSearchResult>(
    `/api/users?search=${encodeURIComponent(query)}&limit=20${after}`
  );

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">No one matches “{query}”.</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="-mx-3">
        {items.map((user) => (
          <li key={user.id} data-reveal className="flex items-center gap-3 p-3">
            {/* Opening a result adds them to "Recent" */}
            <SearchResultLink user={user} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={user} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{user.username}</span>
                <span className="block truncate text-sm text-neutral-500">{user.name}</span>
              </span>
            </SearchResultLink>
            {user.isMe ? (
              <span className="text-sm text-neutral-500">You</span>
            ) : (
              // key: reset the button if the server's answer changes on a later search
              <FollowButton key={`${user.id}-${user.isFollowing}`} userId={user.id} isFollowing={user.isFollowing} />
            )}
          </li>
        ))}
      </ul>
      {nextCursor && (
        <Link
          href={`/search?q=${encodeURIComponent(query)}&cursor=${nextCursor}`}
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          More results
        </Link>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
