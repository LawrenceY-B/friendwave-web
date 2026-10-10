import type { Profile } from "@/interfaces/api";
import { api } from "@/lib/api";
import { auth0 } from "@/lib/auth0";
import { SquarePlus } from "lucide-react";
import Link from "next/link";
import { Avatar } from "./avatar";

// Reads the session, so it must render inside <Suspense> (see layout.tsx)
export async function UserMenu() {
  const session = await auth0.getSession();
  if (!session) {
    return (
      // Auth routes need a full page load, so <a>, not <Link>
      <a
        href="/auth/login"
        className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Log in
      </a>
    );
  }

  const me = await api<Profile>("/api/users/me");
  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="hover:underline">
        Feed
      </Link>
      <Link href="/chats" className="hover:underline">
        Chats
      </Link>
      <Link
        href="/posts/new"
        aria-label="New post"
        className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        <SquarePlus className="size-5" />
      </Link>
      <Link href={`/users/${me.id}`} className="flex items-center gap-2 hover:underline">
        <Avatar user={me} size="sm" />
        <span className="hidden sm:inline">{me.username}</span>
      </Link>
      <a href="/auth/logout" className="text-neutral-500 hover:underline">
        Log out
      </a>
    </nav>
  );
}
