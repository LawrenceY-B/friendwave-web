"use client";

import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, type PointerEvent, useContext, useRef, useState } from "react";
import { PostLiveContext } from "./post-live";

const DOUBLE_TAP_MS = 300;
const TAP_SLOP_PX = 10; // more movement than this is a swipe, not a tap

// A post's photos: swipe (or scroll) sideways, or use the ‹ › buttons / ← → keys.
// Swiping is native scroll-snap, so it feels right on touch screens and trackpads.
export function PostImages({ images, alt }: { images: string[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;
  // Double tap to like (when this post's live state is available)
  const live = useContext(PostLiveContext);
  const [heart, setHeart] = useState(0); // bump to replay the heart animation
  const down = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef<{ x: number; y: number; t: number } | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (!start || !live) return;
    // Moved too far or held too long: a swipe or a press, not a tap
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX || Date.now() - start.t > DOUBLE_TAP_MS)
      return;
    const tap = { x: e.clientX, y: e.clientY, t: Date.now() };
    const prev = lastTap.current;
    if (prev && tap.t - prev.t < DOUBLE_TAP_MS && Math.hypot(tap.x - prev.x, tap.y - prev.y) < 40) {
      lastTap.current = null;
      live.setLike(true); // like only, never unlike (like Instagram)
      setHeart((n) => n + 1);
    } else {
      lastTap.current = tap;
    }
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  };

  // Which photo is showing, from the scroll position (works for swipes too)
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
  };

  return (
    <div className="relative bg-neutral-100 dark:bg-neutral-900">
      <div
        ref={track}
        onScroll={onScroll}
        onKeyDown={many ? onKeyDown : undefined}
        tabIndex={many ? 0 : undefined}
        role={many ? "group" : undefined}
        aria-roledescription={many ? "carousel" : undefined}
        aria-label={many ? `Photo ${index + 1} of ${images.length}` : undefined}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (down.current = null)}
        // "manipulation": keep swiping/pinching, but no double-tap-to-zoom
        className="flex touch-manipulation snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={many ? `${alt} (${i + 1} of ${images.length})` : alt}
            width={600}
            height={600}
            unoptimized
            draggable={false}
            className="aspect-square w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {heart > 0 && (
        <Heart
          key={heart}
          aria-hidden
          data-testid="like-heart"
          className="heart-pop pointer-events-none absolute top-1/2 left-1/2 size-24 fill-white text-white drop-shadow-lg"
        />
      )}

      {many && (
        <>
          {index > 0 && (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-neutral-900 shadow hover:bg-white"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-neutral-900 shadow hover:bg-white"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
            {images.map((src, i) => (
              <span
                key={src}
                data-active={i === index}
                className={`size-1.5 rounded-full ${i === index ? "bg-blue-500" : "bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
