import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { SearchBox } from "@/components/search-box";
import type { UserSearchResult } from "@/interfaces/api";
import { apiPage } from "@/lib/api";
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
    return <p className="py-12 text-center text-sm text-neutral-500">Find people by username or name.</p>;
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
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
        {items.map((user) => (
          <li key={user.id} className="flex items-center gap-3 p-3">
            <Link href={`/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={user} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{user.username}</span>
                <span className="block truncate text-sm text-neutral-500">{user.name}</span>
              </span>
            </Link>
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
