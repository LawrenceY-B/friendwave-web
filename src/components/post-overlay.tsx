"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

// The frame around a post opened on top of another page. Closing it goes back
// in history, so you land exactly where you were (same page, same scroll).
// z-[60]: above the story viewer (z-50), which "See post" opens it over.
export function PostOverlay({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // If a menu (sheet) is open, Esc closes that first, not the whole post
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) router.back();
    };
    window.addEventListener("keydown", onKey);
    // Don't let the page behind scroll while the post is open
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && router.back()}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Close post"
        className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
      >
        <X className="size-5" />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post"
        className="h-full w-full overflow-hidden bg-white sm:h-[85vh] sm:max-w-4xl sm:rounded-xl dark:bg-neutral-950"
      >
        {children}
      </div>
    </div>
  );
}
