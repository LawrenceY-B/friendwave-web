"use client";

import { addToStory } from "@/lib/actions";
import { useState, useTransition } from "react";

export function AddToStoryButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "added" | "failed">("idle");

  return (
    <button
      type="button"
      disabled={pending || status === "added"}
      onClick={() =>
        startTransition(async () => {
          try {
            await addToStory(postId);
            setStatus("added");
          } catch {
            setStatus("failed");
          }
        })
      }
      className="text-sm text-blue-600 hover:underline disabled:no-underline disabled:opacity-60"
    >
      {pending
        ? "Adding…"
        : status === "added"
          ? "Added to your story ✓"
          : status === "failed"
            ? "Couldn't add it, try again"
            : "Add to your story"}
    </button>
  );
}
