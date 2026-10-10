"use client";

import { gsap, reducedMotion, ScrollTrigger } from "@/lib/motion";
import "lenis/dist/lenis.css";
import { type LenisRef, ReactLenis, useLenis } from "lenis/react";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// Smooth, eased scrolling for the whole page (Lenis), driven by GSAP's clock so
// scroll-triggered animations stay in step. Touch screens keep their native scrolling
// (it's already smooth there); reduced motion turns it off.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useSyncExternalStore(subscribe, reducedMotion, () => false);
  const lenis = useRef<LenisRef>(null);

  useEffect(() => {
    if (reduce) return;
    const update = (time: number) => lenis.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, [reduce]);

  useLenis(ScrollTrigger.update);

  if (reduce) return children;
  return (
    <ReactLenis
      root
      ref={lenis}
      options={{
        autoRaf: false,
        lerp: 0.1,
        // Inner scroll areas opt out with data-lenis-prevent (chat, comments, menus, overlays);
        // sideways carousels with data-lenis-prevent-horizontal. (Lenis's automatic
        // nested-scroll detection mistook the photo carousel for a vertical scroller.)
      }}
    >
      {children}
    </ReactLenis>
  );
}

// Freezes the page behind an overlay (post, story viewer, menu) while `active`
export function useScrollLock(active = true) {
  const lenis = useLenis();
  useEffect(() => {
    if (!active) return;
    lenis?.stop();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // native scrolling too (touch, reduced motion)
    return () => {
      lenis?.start();
      document.body.style.overflow = overflow;
    };
  }, [active, lenis]);
}

// Smoothly to the top (the "New posts" pill)
export function useScrollToTop() {
  const lenis = useLenis();
  return () => (lenis ? lenis.scrollTo(0, { duration: 1.1 }) : window.scrollTo({ top: 0, behavior: "smooth" }));
}
