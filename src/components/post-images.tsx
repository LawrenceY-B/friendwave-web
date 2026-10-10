"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, useRef, useState } from "react";

// A post's photos: swipe (or scroll) sideways, or use the ‹ › buttons / ← → keys.
// Swiping is native scroll-snap, so it feels right on touch screens and trackpads.
export function PostImages({ images, alt }: { images: string[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

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
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
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
