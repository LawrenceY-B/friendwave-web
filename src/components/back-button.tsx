"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Goes back if there's somewhere to go back to (opened from inside the app),
// otherwise to the feed (e.g. the link was opened in a new tab)
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      aria-label="Back"
      className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
