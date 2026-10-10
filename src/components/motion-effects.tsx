"use client";

import { gsap, reducedMotion, ScrollTrigger } from "@/lib/motion";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

// Overlays animate themselves; fading the page behind them would flash it
const OWN_MOTION = /^\/(posts|stories)(\/|$)/;

// App-wide motion, mounted once in the layout:
// - anything marked `data-reveal` slides up into view the first time it scrolls in
//   (and live-added rows animate in where they appear)
// - pages cross-fade when you move between them
// - the header tucks away while you scroll down and comes back when you scroll up
export function MotionEffects() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (reducedMotion()) return;
    const viewport = () => window.innerHeight;
    const show = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        if (entering.length === 0) return;
        entering.forEach((el) => show.unobserve(el));
        gsap.to(entering, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "opacity,transform",
        });
      },
      { rootMargin: "0px 0px -6% 0px" }
    );
    const register = (el: HTMLElement, initial: boolean) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      const box = el.getBoundingClientRect();
      // Already on screen when the page first loads: leave it be (no blink after hydration)
      if (initial && box.top < viewport() && box.bottom > 0) return;
      gsap.set(el, { opacity: 0, y: 40, scale: 0.97 });
      show.observe(el);
    };
    const scan = (root: Element, initial: boolean) => {
      if (root instanceof HTMLElement && root.matches("[data-reveal]")) register(root, initial);
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => register(el, initial));
    };
    scan(document.body, true);
    const added = new MutationObserver((mutations) => {
      for (const m of mutations) m.addedNodes.forEach((node) => node instanceof Element && scan(node, false));
    });
    added.observe(document.body, { childList: true, subtree: true });
    return () => {
      added.disconnect();
      show.disconnect();
    };
  }, []);

  // Page cross-fade (before paint, so the new page never shows un-faded)
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    // The page changed under scroll-linked animations: re-measure once it has laid out
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (from === pathname || reducedMotion() || OWN_MOTION.test(from) || OWN_MOTION.test(pathname)) return;
    const main = document.querySelector("main");
    if (!main) return;
    window.dispatchEvent(new Event("friendwave:show-header"));
    gsap.fromTo(
      main,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "opacity,transform" }
    );
  }, [pathname]);

  // Header: hide on the way down, back on the way up (or near the top)
  const header = useRef<HTMLElement | null>(null);
  const hidden = useRef(false);
  const setHidden = (hide: boolean) => {
    header.current ??= document.querySelector<HTMLElement>("[data-app-header]");
    if (!header.current || hidden.current === hide) return;
    hidden.current = hide;
    gsap.to(header.current, {
      yPercent: hide ? -100 : 0,
      duration: hide ? 0.35 : 0.5,
      ease: hide ? "power2.in" : "power3.out",
    });
  };
  useLenis(({ scroll, direction, velocity }) => {
    if (reducedMotion()) return;
    if (scroll < 80) setHidden(false);
    else if (direction === 1 && Math.abs(velocity) > 0.5) setHidden(true);
    else if (direction === -1) setHidden(false);
  });
  useEffect(() => {
    const showHeader = () => setHidden(false);
    window.addEventListener("friendwave:show-header", showHeader);
    return () => window.removeEventListener("friendwave:show-header", showHeader);
  }, []);

  return null;
}
