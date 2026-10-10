import type { Profile } from "@/interfaces/api";
import { api, ApiError } from "@/lib/api";
import { auth0 } from "@/lib/auth0";
import { House, LogOut, type LucideIcon, MessageCircle, Search, SquarePlus } from "lucide-react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { BottomNav } from "./bottom-nav";
import { NotificationBell } from "./notification-bell";

// Reads the session, so it must render inside <Suspense> (see layout.tsx)
export async function UserMenu() {
  const session = await auth0.getSession();
  if (!session) {
    return (
      // Auth routes need a full page load, so <a>, not <Link>
      // eslint-disable-next-line @next/next/no-html-link-for-pages -- Auth0 routes (proxy.ts) need a full page load
      <a
        href="/auth/login"
        className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Log in
      </a>
    );
  }

  const [me, unread] = await Promise.all([loadMe(), loadUnread()]);
  if (!me) {
    // The API is down: keep the header usable instead of crashing the whole page
    return (
      <nav className="flex items-center gap-4 text-sm">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          API offline
        </span>
        <LogoutLink />
      </nav>
    );
  }

  // Icons only; each has a tooltip (title) and a name for screen readers (aria-label)
  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {/* On phones these move to the bottom bar (bottom-nav.tsx) */}
      <div className="hidden items-center gap-2 sm:flex">
        <NavIcon href="/" label="Feed" icon={House} />
        <NavIcon href="/search" label="Search people" icon={Search} />
        <NavIcon href="/create" label="New post" icon={SquarePlus} />
        <NavIcon href="/chats" label="Chats" icon={MessageCircle} />
      </div>
      {/* Bell stays in the header on phones too (the bottom bar keeps its 4 tabs) */}
      <NotificationBell initialUnread={unread} />
      <Link href={`/users/${me.id}`} aria-label="Your profile" title="Your profile" className="ml-1 rounded-full p-1">
        <Avatar user={me} size="sm" />
      </Link>
      <LogoutLink />
    </nav>
  );
}

const iconClass = "rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900";

function NavIcon({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link href={href} aria-label={label} title={label} className={iconClass}>
      <Icon className="size-5" />
    </Link>
  );
}

// Auth routes need a full page load, so <a>, not <Link>
function LogoutLink() {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- Auth0 routes (proxy.ts) need a full page load
    <a href="/auth/logout" aria-label="Log out" title="Log out" className={`${iconClass} text-neutral-500`}>
      <LogOut className="size-5" />
    </a>
  );
}

async function loadMe() {
  try {
    return await api<Profile>("/api/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) return null;
    throw error;
  }
}

// The phone bottom bar, only for logged-in users. Rendered outside the header:
// the header's backdrop-blur would otherwise pin a `fixed` child to the header.
export async function MobileNav() {
  const session = await auth0.getSession();
  return session ? <BottomNav /> : null;
}

async function loadUnread() {
  try {
    return (await api<{ count: number }>("/api/notifications/unread-count")).count;
  } catch {
    return 0; // the bell still works live; the count catches up on the next page load
  }
}
