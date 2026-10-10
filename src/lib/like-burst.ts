"use client";

import { gsap, reducedMotion } from "./motion";

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const COLORS = ["#ff2d55", "#ff5e3a", "#ff9500", "#ff3b8d", "#bf5af2", "#ffd60a"];
let gradientId = 0;

function heartSvg(size: number, fill: string, extra = "") {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" ${extra}><path d="${HEART}" fill="${fill}"/></svg>`;
}

function el(parent: HTMLElement, html: string, x: number, y: number) {
  const node = document.createElement("div");
  node.innerHTML = html;
  Object.assign(node.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  parent.appendChild(node);
  return node;
}

// The double-tap "like" celebration, at (x, y) inside `container` (which must be
// position: relative). Builds its own elements and removes them when done.
export function likeBurst(container: HTMLElement, x: number, y: number) {
  const reduce = reducedMotion();
  const id = `like-grad-${++gradientId}`;
  const big = el(
    container,
    `<svg viewBox="0 0 24 24" width="110" height="110" aria-hidden="true" style="filter: drop-shadow(0 10px 24px rgb(255 45 85 / .55))">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff9500"/><stop offset=".45" stop-color="#ff2d55"/><stop offset="1" stop-color="#bf5af2"/>
      </linearGradient></defs>
      <path d="${HEART}" fill="url(#${id})"/>
      <path d="${HEART}" fill="none" stroke="rgb(255 255 255 / .55)" stroke-width=".6"/>
    </svg>`,
    x,
    y
  );
  big.setAttribute("data-testid", "like-heart");
  const parts: HTMLElement[] = [big];
  const tl = gsap.timeline({ onComplete: () => parts.forEach((p) => p.remove()) });
  gsap.set(big, { xPercent: -50, yPercent: -50, transformOrigin: "50% 60%", zIndex: 2 }); // confetti flies out from behind it

  if (reduce) {
    tl.fromTo(big, { opacity: 0 }, { opacity: 1, duration: 0.15 }).to(big, { opacity: 0, duration: 0.3, delay: 0.4 });
    return;
  }

  // Shockwave ring
  const ring = el(container, "", x, y);
  Object.assign(ring.style, {
    width: "120px",
    height: "120px",
    borderRadius: "9999px",
    border: "6px solid rgb(255 255 255 / .9)",
    boxShadow: "0 0 30px rgb(255 45 85 / .6)",
  });
  parts.push(ring);
  gsap.set(ring, { xPercent: -50, yPercent: -50, scale: 0.2, opacity: 0.9 });

  // The big heart: slam in, wobble, settle, then float up and away
  tl.fromTo(
    big,
    { scale: 0, rotation: -25, opacity: 0 },
    { scale: 1.35, rotation: 8, opacity: 1, duration: 0.28, ease: "back.out(3)" }
  )
    .to(big, { scale: 0.92, rotation: -4, duration: 0.14, ease: "power2.inOut" })
    .to(big, { scale: 1.08, rotation: 0, duration: 0.5, ease: "elastic.out(1.2, 0.35)" })
    .to(big, { y: -90, scale: 0.4, opacity: 0, duration: 0.55, ease: "power2.in" }, "+=0.15");
  tl.to(ring, { scale: 2.6, opacity: 0, borderWidth: 0, duration: 0.7, ease: "expo.out" }, 0.08);

  // Little hearts and sparks flying out in a circle
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + gsap.utils.random(-0.2, 0.2);
    const distance = gsap.utils.random(70, 150);
    const color = COLORS[i % COLORS.length];
    const isHeart = i % 2 === 0;
    const size = isHeart ? gsap.utils.random(14, 26) : gsap.utils.random(6, 10);
    const node = el(
      container,
      isHeart
        ? heartSvg(size, color)
        : `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};box-shadow:0 0 10px ${color}"></span>`,
      x,
      y
    );
    parts.push(node);
    gsap.set(node, { xPercent: -50, yPercent: -50, scale: 0 });
    tl.to(
      node,
      {
        keyframes: [
          { scale: 1, duration: 0.15, ease: "back.out(4)" },
          {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance + 30, // a little gravity
            rotation: gsap.utils.random(-180, 180),
            duration: gsap.utils.random(0.6, 0.9),
            ease: "power4.out",
          },
          { opacity: 0, scale: 0.2, duration: 0.25, ease: "power1.in" },
        ],
      },
      0.06 + i * 0.008
    );
  }
}

// A small pop of dots around an element (the heart button when you like)
export function miniBurst(target: HTMLElement) {
  if (reducedMotion()) return;
  const host = target.parentElement;
  if (!host) return;
  host.style.position ||= "relative";
  const x = target.offsetLeft + target.offsetWidth / 2;
  const y = target.offsetTop + target.offsetHeight / 2;
  const dots: HTMLElement[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dot = el(
      host,
      `<span style="display:block;width:5px;height:5px;border-radius:9999px;background:${COLORS[i % COLORS.length]}"></span>`,
      x,
      y
    );
    dots.push(dot);
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.to(dot, {
      x: Math.cos(angle) * 20,
      y: Math.sin(angle) * 20,
      opacity: 0,
      scale: 0.3,
      duration: 0.55,
      ease: "power3.out",
      onComplete: () => dot.remove(),
    });
  }
}
