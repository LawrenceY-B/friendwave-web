"use client";

import { finishPost } from "@/lib/actions";
import { MAX_CAPTION, MAX_IMAGE_BYTES, MAX_IMAGES, POST_IMAGE_MAX_SIDE } from "@/lib/limits";
import { shrinkImage } from "@/lib/resize-image";
import { uploadPost } from "@/lib/upload";
import { ImagePlus, X } from "lucide-react";
import { type FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

type Phase = { kind: "idle" } | { kind: "preparing" } | { kind: "uploading"; progress: number } | { kind: "finishing" };

export function NewPostForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [, startTransition] = useTransition();
  const busy = phase.kind !== "idle";

  // Next.js keeps this page alive after you leave it. After a successful post, coming
  // back should show an empty form (not the old photos, inviting a double post).
  const posted = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (!posted.current) return;
      posted.current = false;
      setFiles([]);
      setCaption("");
      setPickError(null);
      setUploadError(null);
      setPhase({ kind: "idle" });
    };
  }, []);

  // Preview URLs for the chosen files, released when no longer shown
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const images = picked.filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES - files.length;
    setPhase({ kind: "preparing" });
    // Shrink first, then check the size: a 12 MB camera photo is fine once resized
    const shrunk = await Promise.all(images.slice(0, room).map((f) => shrinkImage(f, POST_IMAGE_MAX_SIDE)));
    const fitting = shrunk.filter((f) => f.size <= MAX_IMAGE_BYTES);
    setPhase({ kind: "idle" });

    const problems = [
      images.length < picked.length && "only images can be added",
      fitting.length < shrunk.length && "a photo couldn't be made small enough (max 5 MB)",
      images.length > room && `you can add up to ${MAX_IMAGES} photos`,
    ].filter(Boolean);
    setPickError(problems.length ? `Some files were skipped: ${problems.join(", ")}.` : null);
    setFiles((prev) => [...prev, ...fitting]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (files.length === 0 || busy) return;
    setUploadError(null);
    setPhase({ kind: "uploading", progress: 0 });
    try {
      await uploadPost(files, caption.trim(), (progress) => setPhase({ kind: "uploading", progress }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setPhase({ kind: "idle" }); // keep the draft so they can try again
      return;
    }
    posted.current = true;
    setPhase({ kind: "finishing" });
    // Refreshes the feed on the server and goes there (the new post is first)
    startTransition(() => finishPost());
  }

  const buttonLabel =
    phase.kind === "preparing"
      ? "Preparing photos…"
      : phase.kind === "uploading"
        ? `Uploading ${Math.round(phase.progress * 100)}%`
        : phase.kind === "finishing"
          ? "Sharing…"
          : "Share";

  return (
    <form onSubmit={submit} className="space-y-4">
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {files.map((file, i) => (
            <li
              key={previews[i]}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={previews[i]} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
              {!busy && (
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {files.length < MAX_IMAGES && !busy && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 p-8 text-sm text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
          <ImagePlus className="size-8" />
          {files.length === 0 ? "Choose photos" : `Add more (${files.length}/${MAX_IMAGES})`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = ""; // allow picking the same file again after removing it
            }}
          />
        </label>
      )}

      <div>
        <textarea
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={MAX_CAPTION}
          rows={3}
          placeholder="Write a caption…"
          aria-label="Caption"
          disabled={busy}
          className="w-full resize-none rounded-xl border border-neutral-300 bg-transparent p-3 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
        />
        <p className="text-right text-xs text-neutral-500">
          {caption.length}/{MAX_CAPTION}
        </p>
      </div>

      {/* Two independent messages: a file-picking problem and the upload's result */}
      {pickError && (
        <p role="alert" className="text-sm text-red-600">
          {pickError}
        </p>
      )}
      {uploadError && (
        <p role="alert" className="text-sm text-red-600">
          {uploadError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || files.length === 0}
        className="w-full rounded-full bg-blue-600 py-2 font-medium text-white disabled:opacity-40"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
