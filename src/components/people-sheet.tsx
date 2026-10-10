"use client";

import type { UserSummary } from "@/interfaces/api";
import { listPeople } from "@/lib/actions";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar } from "./avatar";
import { Sheet } from "./sheet";

// A profile count ("941 followers") that opens a sheet listing those people
export function PeopleSheet({
  userId,
  which,
  count,
}: {
  userId: string;
  which: "followers" | "following";
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<UserSummary[] | null>(null);
  const [loading, startLoading] = useTransition();
  const label = which === "followers" ? (count === 1 ? "follower" : "followers") : "following";

  const show = () => {
    setOpen(true);
    // Load fresh each time it opens (the list may have changed)
    startLoading(async () => setPeople(await listPeople(userId, which)));
  };

  return (
    <>
      <button type="button" onClick={show} className="flex flex-col items-start text-left">
        <span className="font-semibold">{count.toLocaleString("en")}</span>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      </button>
      <Sheet title={which === "followers" ? "Followers" : "Following"} open={open} onClose={() => setOpen(false)}>
        {loading && !people ? (
          <p className="p-6 text-center text-sm text-neutral-500">Loading…</p>
        ) : people && people.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">No one yet.</p>
        ) : (
          <ul>
            {people?.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/users/${person.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Avatar user={person} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{person.username}</span>
                    <span className="block truncate text-sm text-neutral-500">{person.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
