"use client";

import { ArrowLeft } from "lucide-react";
import { useBack } from "./navigation-tracker";

// Back to the previous page in the app; if you arrived from outside (a shared link,
// login, a refresh), to `fallback` instead, never out of the app
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const back = useBack(fallback);
  return (
    <button
      type="button"
      onClick={back}
      aria-label="Back"
      className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
