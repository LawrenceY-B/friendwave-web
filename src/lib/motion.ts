"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// One place to set up GSAP for the app. Import gsap from here, not "gsap", so the
// plugins are always registered.
gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.5 });

export { gsap, ScrollTrigger, useGSAP };

// People who ask their device for less motion get none of the flourishes
export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
