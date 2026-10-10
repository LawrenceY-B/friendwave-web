"use client";

import type { UserSummary } from "@/interfaces/api";
import { clearSearches, forgetSearch, rememberSearch, useRecentSearches } from "@/lib/recent-searches";
import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "./avatar";

// The "Recent" list on the empty search page
export function RecentSearches() {
  const recent = useRecentSearches();
  if (recent.length === 0) return null;
  return (
    <section aria-label="Recent searches" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">Recent</h2>
        <button type="button" onClick={clearSearches} className="text-sm text-blue-600 hover:underline">
          Clear all
        </button>
      </div>
      <ul className="-mx-3">
        {recent.map((user) => (
          <li key={user.id} className="flex items-center gap-3 p-3">
            <Link href={`/users/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={user} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{user.username}</span>
                <span className="block truncate text-sm text-neutral-500">{user.name}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => forgetSearch(user.id)}
              aria-label={`Remove ${user.username} from recent`}
              className="rounded-full p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// A search result link that remembers the person in "Recent" when opened
export function SearchResultLink({
  user,
  children,
  className,
}: {
  user: UserSummary;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={`/users/${user.id}`} onClick={() => rememberSearch(user)} className={className}>
      {children}
    </Link>
  );
}
