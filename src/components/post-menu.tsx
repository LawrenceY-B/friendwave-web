"use client";

import type { Post } from "@/interfaces/api";
import { addToStory, deletePost } from "@/lib/actions";
import { CircleUserRound, Flag, Link2, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sheet, SheetItem } from "./sheet";

type Status = "idle" | "story-added" | "story-failed" | "confirm-delete" | "copied";

export function PostMenu({ post, meId }: { post: Post; meId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [pending, startTransition] = useTransition();
  const isMine = post.author?.id === meId;

  const close = () => {
    setOpen(false);
    setStatus("idle");
  };

  const shareToStory = () =>
    startTransition(async () => {
      try {
        await addToStory(post.id);
        setStatus("story-added");
      } catch {
        setStatus("story-failed");
      }
    });

  // First tap asks for confirmation, second tap deletes
  const remove = () => {
    if (status !== "confirm-delete") return setStatus("confirm-delete");
    startTransition(() => deletePost(post.id));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
      setStatus("copied");
    } catch {
      setStatus("idle");
    }
  };

  // Same item for your posts ("Add to your story") and others' ("Share to your story")
  const storyItem = (label: string) => (
    <SheetItem
      label={
        pending && status !== "confirm-delete"
          ? "Adding…"
          : status === "story-added"
            ? "Added to your story ✓"
            : status === "story-failed"
              ? "Couldn't add it, try again"
              : label
      }
      icon={PlusCircle}
      onClick={shareToStory}
      disabled={pending || status === "story-added"}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Post options"
        aria-haspopup="dialog"
        className="rounded-full p-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <MoreVertical className="size-5" />
      </button>

      <Sheet title={post.author?.username ?? "Post"} open={open} onClose={close}>
        {isMine ? (
          <>
            {storyItem("Add to your story")}
            <SheetItem
              label={
                pending && status === "confirm-delete"
                  ? "Deleting…"
                  : status === "confirm-delete"
                    ? "Tap again to delete"
                    : "Delete post"
              }
              icon={Trash2}
              onClick={remove}
              danger
              disabled={pending}
            />
          </>
        ) : (
          <>
            {/* Anyone's post can go on your story; the viewer credits the original poster */}
            {storyItem("Share to your story")}
            <SheetItem label={status === "copied" ? "Link copied ✓" : "Copy link"} icon={Link2} onClick={copyLink} />
            {post.author && (
              <SheetItem
                label="Go to profile"
                icon={CircleUserRound}
                onClick={() => {
                  close();
                  router.push(`/users/${post.author!.id}`);
                }}
              />
            )}
            <SheetItem label="Report" icon={Flag} comingSoon />
          </>
        )}
      </Sheet>
    </>
  );
}
