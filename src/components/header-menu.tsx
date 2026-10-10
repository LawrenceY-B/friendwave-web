"use client";

import { deleteAccount } from "@/lib/actions";
import { gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { setTheme, type Theme, useTheme } from "@/lib/theme";
import { LogOut, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Sheet } from "./sheet";

const PHONE = "(max-width: 639px)";
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// The ☰ menu on your own profile (like Instagram): theme, log out, delete account.
// A dropdown on larger screens, a bottom sheet on phones.
export function HeaderMenu({ meId, username }: { meId: string; username: string }) {
  const pathname = usePathname();
  // Remember where it was opened, so leaving the page closes it without an effect
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const [confirming, setConfirming] = useState(false);
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false
  );
  const root = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => setOpenAt(null);

  // ☰ ⇄ ✕: the two lines swing into a cross
  useGSAP(
    () => {
      const [top, bottom] = icon.current ? Array.from(icon.current.children) : [];
      const to = open
        ? [
            { y: 3.5, rotate: 45 },
            { y: -3.5, rotate: -45 },
          ]
        : [
            { y: 0, rotate: 0 },
            { y: 0, rotate: 0 },
          ];
      const duration = reducedMotion() ? 0 : 0.45;
      gsap.to(top, { ...to[0], duration, ease: "back.out(2)" });
      gsap.to(bottom, { ...to[1], duration, ease: "back.out(2)" });
      if (open && !phone && panel.current && !reducedMotion())
        gsap.fromTo(
          panel.current,
          { opacity: 0, y: -8, scale: 0.96, transformOrigin: "100% 0%" },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.8)" }
        );
    },
    { dependencies: [open, phone] }
  );

  // Desktop dropdown: Esc or a click outside closes it
  useEffect(() => {
    if (!open || phone) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, phone]);

  if (pathname !== `/users/${meId}`) return null;

  const content = (
    <MenuContent
      onDelete={() => {
        close();
        setConfirming(true);
      }}
    />
  );

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpenAt(open ? null : pathname)}
        aria-label="Menu"
        aria-expanded={open}
        title="Menu"
        className="flex size-9 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        <span ref={icon} aria-hidden className="flex w-5 flex-col gap-[5px]">
          <span className="block h-[2px] w-5 rounded-full bg-current" />
          <span className="block h-[2px] w-5 rounded-full bg-current" />
        </span>
      </button>

      {phone ? (
        <Sheet title="Menu" open={open} onClose={close}>
          {content}
        </Sheet>
      ) : (
        open && (
          <div
            ref={panel}
            role="menu"
            aria-label="Menu"
            className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10"
          >
            {content}
          </div>
        )
      )}

      <DeleteAccountSheet open={confirming} onClose={() => setConfirming(false)} username={username} />
    </div>
  );
}

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function MenuContent({ onDelete }: { onDelete: () => void }) {
  const theme = useTheme();
  const track = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const index = THEMES.findIndex((t) => t.value === theme);

  // The highlight slides to the chosen theme
  useGSAP(
    () => {
      const button = track.current?.querySelectorAll("button")[index];
      if (!button || !indicator.current) return;
      gsap.to(indicator.current, {
        x: button.offsetLeft,
        width: button.offsetWidth,
        duration: reducedMotion() ? 0 : 0.45,
        ease: "elastic.out(1, 0.7)",
      });
    },
    { dependencies: [index] }
  );

  const row =
    "flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] hover:bg-neutral-100 dark:hover:bg-neutral-800";
  return (
    <div className="py-2">
      <p className="px-4 pt-1 pb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase">Appearance</p>
      <div className="px-4 pb-3">
        <div
          ref={track}
          role="radiogroup"
          aria-label="Theme"
          className="relative flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800"
        >
          <span
            ref={indicator}
            aria-hidden
            className="absolute top-1 bottom-1 left-0 rounded-full bg-white shadow-sm dark:bg-neutral-950"
          />
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm transition-colors ${
                theme === value ? "font-semibold" : "text-neutral-500"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-200 pt-1 dark:border-neutral-800">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Auth0 routes (proxy.ts) need a full page load */}
        <a href="/auth/logout" role="menuitem" className={row}>
          <LogOut className="size-5" />
          Log out
        </a>
        <button type="button" role="menuitem" onClick={onDelete} className={`${row} text-red-600`}>
          <Trash2 className="size-5" />
          Delete account
        </button>
      </div>
    </div>
  );
}

// Deleting is permanent, so you type your username to confirm
function DeleteAccountSheet({ open, onClose, username }: { open: boolean; onClose: () => void; username: string }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await deleteAccount(typed.trim());
      if (result.error) return setError(result.error);
      // A full page load: /auth/logout is an Auth0 route (proxy.ts), not a Next.js page
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/auth/logout";
    });

  return (
    <Sheet title="Delete account" open={open} onClose={onClose}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This permanently deletes your account, your posts, stories, comments, likes, chats and messages, and your
          photos. It can&apos;t be undone.
        </p>
        <label className="block space-y-1.5 text-sm">
          <span>
            Type <span className="font-semibold">{username}</span> to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Your username"
            className="w-full rounded-xl border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-red-500 dark:border-neutral-700"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={!matches || pending}
          onClick={submit}
          className="w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white disabled:opacity-40"
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </Sheet>
  );
}
