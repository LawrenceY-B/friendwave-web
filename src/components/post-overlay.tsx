"use client";

import { useHideAppHeader } from "@/lib/hide-app-header";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { useScrollLock } from "./smooth-scroll";

// The frame around a post opened on top of another page. Closing it goes back
// in history, so you land exactly where you were (same page, same scroll).
// z-[60]: above the story viewer (z-50), which "See post" opens it over.
export function PostOverlay({ children }: { children: ReactNode }) {
  const router = useRouter();
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  // Don't let the page behind scroll while the post is open
  useScrollLock();
  useHideAppHeader();

  // In: the backdrop fades and blurs, the post rises and zooms into place
  useGSAP(() => {
    closing.current = false;
    if (reducedMotion()) return;
    gsap
      .timeline()
      .fromTo(
        backdrop.current,
        { opacity: 0, backdropFilter: "blur(0px)" },
        { opacity: 1, backdropFilter: "blur(6px)", duration: 0.3 }
      )
      .fromTo(
        panel.current,
        { opacity: 0, y: 60, scale: 0.9, rotationX: 8, transformPerspective: 900 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.55, ease: "back.out(1.3)", clearProps: "transform" },
        0.05
      );
  });

  // Out: the reverse, then back in history
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reducedMotion()) return router.back();
    gsap
      .timeline({ onComplete: () => router.back() })
      .to(panel.current, { opacity: 0, y: 40, scale: 0.94, duration: 0.22, ease: "power2.in" })
      .to(backdrop.current, { opacity: 0, duration: 0.18 }, 0.06);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // If a menu (sheet) is open, Esc closes that first, not the whole post
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      ref={backdrop}
      data-lenis-prevent
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close post"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-10 rounded-full bg-black/40 p-2 text-white transition-transform hover:rotate-90 hover:bg-black/60"
      >
        <X className="size-5" />
      </button>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Post"
        className="h-full w-full overflow-hidden bg-white pt-[env(safe-area-inset-top)] sm:h-[85vh] sm:max-w-4xl sm:rounded-xl sm:pt-0 dark:bg-neutral-950"
      >
        {children}
      </div>
    </div>
  );
}
