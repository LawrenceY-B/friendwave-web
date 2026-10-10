"use client";

import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { House, type LucideIcon, MessageCircle, Search, SquarePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

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
  const list = useRef<HTMLUListElement>(null);
  const lens = useRef<HTMLLIElement>(null);
  const placed = useRef(false);
  const activeIndex = TABS.findIndex((t) => t.isActive(pathname));

  // The glass "lens" glides to the active tab, stretching like jelly on the way
  useGSAP(
    () => {
      const link = list.current?.querySelectorAll<HTMLElement>("a")[activeIndex];
      if (!lens.current) return;
      if (!link) {
        gsap.to(lens.current, { opacity: 0, scale: 0.6, duration: 0.25 });
        return;
      }
      const x = link.offsetLeft + link.offsetWidth / 2 - lens.current.offsetWidth / 2;
      if (!placed.current || reducedMotion()) {
        placed.current = true;
        gsap.set(lens.current, { x, opacity: 1, scale: 1 });
        return;
      }
      gsap
        .timeline()
        .to(lens.current, { x, opacity: 1, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.65)" })
        .to(lens.current, { scaleX: 1.35, scaleY: 0.85, duration: 0.15, ease: "power2.out" }, 0)
        .to(lens.current, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" }, 0.15);
      gsap.fromTo(
        link.querySelector("svg"),
        { scale: 0.6, rotation: -15 },
        { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(3)" }
      );
    },
    { dependencies: [activeIndex, pathname] }
  );

  // Out of the way where it would cover things: inside a conversation (the message
  // box sits at the bottom) and in the full-screen story viewer
  if (/^\/chats\/[^/]+/.test(pathname) || pathname.startsWith("/stories")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:hidden"
    >
      <ul
        ref={list}
        className="liquid-glass relative flex w-full max-w-sm items-center justify-around rounded-full p-1.5"
      >
        <li
          ref={lens}
          aria-hidden
          className="liquid-glass-lens pointer-events-none absolute top-1.5 left-0 h-11 w-16 rounded-full opacity-0"
        />
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-11 w-16 items-center justify-center rounded-full transition-opacity duration-300 active:scale-90 ${
                  active ? "" : "opacity-70 hover:opacity-100"
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
