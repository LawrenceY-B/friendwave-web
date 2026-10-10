"use client";

import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useSocketEvent } from "./realtime-provider";
import { useScrollToTop } from "./smooth-scroll";

// "↑ New posts" when someone you follow posts while you're on the feed.
// Tapping it reloads the feed (server) and scrolls to the top.
export function NewPostsPill() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const toTop = useScrollToTop();
  useSocketEvent("feed:new-post", () => setCount((n) => n + 1));

  if (count === 0) return null;
  return (
    <Pill
      count={count}
      pending={pending}
      onClick={() =>
        startTransition(() => {
          router.refresh();
          toTop();
          setCount(0);
        })
      }
    />
  );
}

// Drops in with a bounce, bobs a few times, and pulses when more arrive.
// Its own component so the animations stop when it goes.
function Pill({ count, pending, onClick }: { count: number; pending: boolean; onClick: () => void }) {
  const pill = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(
      pill.current,
      { y: -60, scale: 0.6, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
    );
    // A few bobs to catch your eye, then it settles (a button that never stops moving is hard to hit)
    gsap.to(pill.current, { y: 5, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 5, delay: 0.8 });
  });

  useGSAP(
    () => {
      if (count > 1 && !reducedMotion())
        gsap.fromTo(pill.current, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    },
    { dependencies: [count] }
  );

  return (
    <div className="sticky top-16 z-20 flex justify-center">
      <button
        ref={pill}
        type="button"
        disabled={pending}
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-blue-600/30 hover:brightness-110"
      >
        <ArrowUp className="size-4" />
        New posts
      </button>
    </div>
  );
}
