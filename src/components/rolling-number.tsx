"use client";

import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { useRef } from "react";

// A count that rolls up (or down) like an odometer when it changes
export function RollingNumber({ value, testId }: { value: number; testId?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useGSAP(
    () => {
      const from = previous.current;
      previous.current = value;
      if (from === value || reducedMotion()) return;
      const up = value > from;
      gsap.fromTo(
        ref.current,
        { yPercent: up ? 90 : -90, opacity: 0, filter: "blur(2px)" },
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "back.out(2)", clearProps: "filter" }
      );
    },
    { dependencies: [value] }
  );

  return (
    <span className="inline-flex overflow-hidden py-0.5 tabular-nums">
      <span ref={ref} data-testid={testId} className="inline-block">
        {value.toLocaleString("en")}
      </span>
    </span>
  );
}
