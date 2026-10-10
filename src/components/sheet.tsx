"use client";

import { gsap, reducedMotion } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useScrollLock } from "./smooth-scroll";

interface SheetProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// An options menu: slides up from the bottom on phones, a centred dialog on larger screens.
// Built on the native <dialog>, which gives us Esc-to-close, a backdrop and focus trapping.
export function Sheet({ title, open, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Springs up from the bottom on phones; zooms in as a dialog on larger screens
      if (!reducedMotion()) {
        const phone = window.matchMedia("(max-width: 639px)").matches;
        gsap.fromTo(dialog, phone ? { yPercent: 100 } : { scale: 0.85, opacity: 0, y: 20 }, {
          ...(phone ? { yPercent: 0 } : { scale: 1, opacity: 1, y: 0 }),
          duration: phone ? 0.55 : 0.4,
          ease: phone ? "back.out(1.1)" : "back.out(1.8)",
          clearProps: "transform,opacity", // dragging the handle sets its own transform
        });
        gsap.from(dialog.querySelectorAll("li, button"), {
          opacity: 0,
          y: 12,
          duration: 0.35,
          stagger: 0.04,
          delay: 0.1,
        });
      }
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useScrollLock(open);

  // Next.js keeps pages alive after you leave them; a menu shouldn't still be open when you come back
  useLayoutEffect(() => () => onCloseRef.current(), []);

  // Swipe the handle down to close (phones)
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current !== null) setDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragY > 80) onClose();
    dragStart.current = null;
    setDragY(0);
  };

  return (
    <dialog
      ref={ref}
      data-lenis-prevent
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault(); // Esc: let React state close it
        onClose();
      }}
      // A click on the backdrop lands on the <dialog> element itself
      onClick={(e) => e.target === ref.current && onClose()}
      style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-2xl bg-white p-0 text-neutral-900 backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-sm sm:rounded-2xl dark:bg-neutral-900 dark:text-neutral-100"
    >
      <div
        className="flex cursor-grab touch-none justify-center pt-3 pb-1 sm:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-hidden
      >
        <span className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      </div>
      <h2 className="border-b border-neutral-200 px-4 py-3 text-center font-semibold dark:border-neutral-800">
        {title}
      </h2>
      <div className="max-h-[70dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</div>
    </dialog>
  );
}

interface SheetItemProps {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  comingSoon?: boolean;
  disabled?: boolean;
}

// One row in a sheet: label on the left, icon on the right (like Instagram's menus)
export function SheetItem({ label, icon: Icon, onClick, href, danger, comingSoon, disabled }: SheetItemProps) {
  const className = `flex w-full items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3.5 text-left last:border-b-0 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:border-neutral-800 dark:hover:bg-neutral-800 ${
    danger ? "text-red-600" : ""
  } ${comingSoon ? "opacity-50" : ""}`;
  const content = (
    <>
      <span>
        {label}
        {comingSoon && <span className="block text-xs text-neutral-500">Coming soon</span>}
      </span>
      {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
    </>
  );
  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled || comingSoon} className={className}>
      {content}
    </button>
  );
}
