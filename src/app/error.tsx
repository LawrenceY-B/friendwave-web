"use client";

// Shown when a page fails to load, e.g. the API isn't running.
// In production Next.js replaces server error messages with a generic code (to avoid
// leaking details), so the real message is only shown in development.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="font-medium">Something went wrong.</p>
      {isDev ? (
        <p className="text-sm text-neutral-500">{error.message}</p>
      ) : (
        <p className="text-sm text-neutral-500">Please try again in a moment.</p>
      )}
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
