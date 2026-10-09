"use client";

// Shown when a page fails to load, e.g. the API isn't running
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="font-medium">Something went wrong.</p>
      <p className="text-sm text-neutral-500">{error.message || "Is the Friendwave API running on port 4000?"}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700"
      >
        Try again
      </button>
    </div>
  );
}
