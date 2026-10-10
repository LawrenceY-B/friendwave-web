"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

// Searches as you type (after a short pause). It's also a normal GET form, so
// pressing Enter, or using it before JavaScript loads, works too.
export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = value.trim().slice(0, 50);
      // replace, not push: typing shouldn't fill the back button with every letter
      startTransition(() => router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search"));
    }, 300);
  }

  return (
    <form action="/search" role="search" className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        name="q"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={50}
        autoFocus
        autoComplete="off"
        placeholder="Search people"
        aria-label="Search people"
        className="w-full rounded-full border border-neutral-300 bg-white py-2 pr-4 pl-9 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
      />
      {pending && (
        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-neutral-400">Searching…</span>
      )}
    </form>
  );
}
