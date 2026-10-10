import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline · Friendwave" };

// Shown by the service worker (public/sw.js) when a page can't load because there's no
// connection. Static, and works without JavaScript (plain link to retry).
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny generated icon; must work offline from the cache */}
      <img src="/pwa-icon/192" alt="" width={72} height={72} className="rounded-2xl shadow-lg" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-neutral-500">Check your connection and try again.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full page load is the retry, and must work without JS */}
      <a
        href="/"
        className="rounded-full bg-linear-to-r from-blue-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30"
      >
        Try again
      </a>
    </div>
  );
}
