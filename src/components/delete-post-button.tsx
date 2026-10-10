"use client";

import { deletePost } from "@/lib/actions";
import { useTransition } from "react";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this post? Its comments go with it.")) startTransition(() => deletePost(postId));
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete post"}
    </button>
  );
}
