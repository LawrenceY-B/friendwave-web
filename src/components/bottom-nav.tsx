"use client";

import type { UserSummary } from "@/interfaces/api";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { CircleUserRound, House, MessageCircle, Search, SquarePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useRef } from "react";

interface Tab {
  href: string;
  label: string;
  isActive: (path: string) => boolean;
  icon: (active: boolean) => ReactNode;
}

const iconProps = (active: boolean) => ({ className: "size-6", strokeWidth: active ? 2.4 : 2 });

// Five tabs like Instagram, with New post in the middle. Profile shows your picture.
function tabsFor(me: UserSummary | null): Tab[] {
  const tabs: Tab[] = [
    { href: "/", label: "Feed", isActive: (p) => p === "/", icon: (a) => <House {...iconProps(a)} /> },
    {
      href: "/search",
      label: "Search people",
      isActive: (p) => p.startsWith("/search"),
      icon: (a) => <Search {...iconProps(a)} />,
    },
    {
      href: "/create",
      label: "New post",
      isActive: (p) => p === "/create",
      icon: (a) => <SquarePlus {...iconProps(a)} />,
    },
    {
      href: "/chats",
      label: "Chats",
      isActive: (p) => p === "/chats",
      icon: (a) => <MessageCircle {...iconProps(a)} />,
    },
  ];
  if (me)
    tabs.push({
      href: `/users/${me.id}`,
      label: "Your profile",
      isActive: (p) => p === `/users/${me.id}` || p.startsWith("/settings"),
      icon: (a) =>
        me.avatarUrl ? (
          <Image
            src={me.avatarUrl}
            alt=""
            width={26}
            height={26}
            unoptimized
            className={`size-[26px] rounded-full object-cover ${a ? "ring-2 ring-current ring-offset-1 ring-offset-transparent" : ""}`}
          />
        ) : (
          <CircleUserRound {...iconProps(a)} />
        ),
    });
  return tabs;
}

// Phones only (hidden from `sm:` up, where these live in the header).
// A floating "liquid glass" pill; styles in globals.css.
export function BottomNav({ me }: { me: UserSummary | null }) {
  const pathname = usePathname();
  const list = useRef<HTMLUListElement>(null);
  const lens = useRef<HTMLLIElement>(null);
  const placed = useRef(false);
  const tabs = tabsFor(me);
  const activeIndex = tabs.findIndex((t) => t.isActive(pathname));

  // The glass "lens" glides to the active tab, stretching like jelly on the way
  useGSAP(
    () => {
      const link = list.current?.querySelectorAll<HTMLElement>("a")[activeIndex];
      if (!lens.current) return;
      if (!link) {
        gsap.to(lens.current, { opacity: 0, scale: 0.6, duration: 0.25 });
        return;
      }
      const width = link.offsetWidth;
      const x = link.offsetLeft;
      if (!placed.current || reducedMotion()) {
        placed.current = true;
        gsap.set(lens.current, { x, width, opacity: 1, scale: 1 });
        return;
      }
      gsap
        .timeline()
        .to(lens.current, { x, width, opacity: 1, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.65)" })
        .to(lens.current, { scaleX: 1.3, scaleY: 0.85, duration: 0.15, ease: "power2.out" }, 0)
        .to(lens.current, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" }, 0.15);
      gsap.fromTo(
        link.firstElementChild,
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
      <ul ref={list} className="liquid-glass relative flex w-full max-w-md items-center rounded-full p-1.5">
        <li
          ref={lens}
          aria-hidden
          className="liquid-glass-lens pointer-events-none absolute top-1.5 left-0 h-11 w-16 rounded-full opacity-0"
        />
        {tabs.map(({ href, label, icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-11 w-full items-center justify-center rounded-full transition-opacity duration-300 active:scale-90 ${
                  active ? "" : "opacity-70 hover:opacity-100"
                }`}
              >
                {icon(active)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
