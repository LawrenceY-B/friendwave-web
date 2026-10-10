"use client";

import { House, type LucideIcon, MessageCircle, Search, SquarePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (path: string) => boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "Feed", icon: House, isActive: (p) => p === "/" },
  { href: "/search", label: "Search people", icon: Search, isActive: (p) => p.startsWith("/search") },
  { href: "/create", label: "New post", icon: SquarePlus, isActive: (p) => p === "/create" },
  { href: "/chats", label: "Chats", icon: MessageCircle, isActive: (p) => p === "/chats" },
];

// Phones only (hidden from `sm:` up, where these live in the header).
// A floating "liquid glass" pill; styles in globals.css.
export function BottomNav() {
  const pathname = usePathname();

  // Out of the way where it would cover things: inside a conversation (the message
  // box sits at the bottom) and in the full-screen story viewer
  if (/^\/chats\/[^/]+/.test(pathname) || pathname.startsWith("/stories")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:hidden"
    >
      <ul className="liquid-glass flex w-full max-w-sm items-center justify-around rounded-full p-1.5">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 w-16 items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                  active ? "liquid-glass-lens" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
