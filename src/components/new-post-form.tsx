"use client";

import { createPost } from "@/lib/actions";
import { MAX_CAPTION, MAX_IMAGE_BYTES, MAX_IMAGES } from "@/lib/limits";
import { ImagePlus, X } from "lucide-react";
import { useActionState, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export function NewPostForm() {
  const [state, formAction, pending] = useActionState(createPost, {});
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);

  // Next.js keeps this page alive after you leave it. After a successful post, coming
  // back should show an empty form (not the old photos, inviting a double post).
  // A successful submit redirects away; a failed one returns an error and keeps the draft.
  const submitted = useRef(false);
  useEffect(() => {
    submitted.current = false; // an error came back: keep the draft
  }, [state]);
  useLayoutEffect(() => {
    return () => {
      if (!submitted.current) return;
      submitted.current = false;
      setFiles([]);
      setCaption("");
      setPickError(null);
    };
  }, []);

  // Preview URLs for the chosen files, released when no longer shown
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const images = picked.filter((f) => f.type.startsWith("image/"));
    const small = images.filter((f) => f.size <= MAX_IMAGE_BYTES);
    const room = MAX_IMAGES - files.length;
    const problems = [
      images.length < picked.length && "only images can be added",
      small.length < images.length && "photos must be 5 MB or smaller",
      small.length > room && `you can add up to ${MAX_IMAGES} photos`,
    ].filter(Boolean);
    setPickError(problems.length ? `Some files were skipped: ${problems.join(", ")}.` : null);
    setFiles((prev) => [...prev, ...small.slice(0, room)]);
  }

  // The form submits the photos from state (not the file input), so removed ones aren't sent
  function submit(formData: FormData) {
    formData.delete("images");
    files.forEach((file) => formData.append("images", file, file.name));
    submitted.current = true;
    formAction(formData);
  }

  return (
    <form action={submit} className="space-y-4">
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {files.map((file, i) => (
            <li
              key={previews[i]}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={previews[i]} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length < MAX_IMAGES && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 p-8 text-sm text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
          <ImagePlus className="size-8" />
          {files.length === 0 ? "Choose photos" : `Add more (${files.length}/${MAX_IMAGES})`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
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
          className="w-full resize-none rounded-xl border border-neutral-300 bg-transparent p-3 text-sm outline-none focus:border-blue-500 dark:border-neutral-700"
        />
        <p className="text-right text-xs text-neutral-500">
          {caption.length}/{MAX_CAPTION}
        </p>
      </div>

      {/* Two independent messages: a file-picking problem and the last save's result.
          Showing only one meant a stale save error could hide a new picking error. */}
      {pickError && (
        <p role="alert" className="text-sm text-red-600">
          {pickError}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || files.length === 0}
        className="w-full rounded-full bg-blue-600 py-2 font-medium text-white disabled:opacity-40"
      >
        {pending ? "Sharing…" : "Share"}
      </button>
    </form>
  );
}
