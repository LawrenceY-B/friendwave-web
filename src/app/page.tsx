import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/post-skeleton";
import type { Post } from "@/interfaces/api";
import { apiPage } from "@/lib/api";
import { auth0 } from "@/lib/auth0";
import Link from "next/link";
import { Suspense } from "react";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

// Logged out: landing page. Logged in: your feed.
async function Home({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const session = await auth0.getSession();
  if (!session) return <Landing />;

  const { cursor } = await searchParams;
  const query = typeof cursor === "string" && /^[0-9a-f]{24}$/.test(cursor) ? `?cursor=${cursor}` : "";
  const { items, nextCursor } = await apiPage<Post>(`/api/feed${query}`);

  if (items.length === 0) {
    return (
      <p className="py-20 text-center text-neutral-500">
        {query ? "No more posts." : "Your feed is empty. Follow people to see their posts here."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {nextCursor && (
        <Link
          href={`/?cursor=${nextCursor}`}
          className="block rounded-lg border border-neutral-200 py-2 text-center text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          Older posts
        </Link>
      )}
    </div>
  );
}

function Landing() {
  return (
    <section className="flex flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Friendwave</h1>
      <p className="max-w-sm text-neutral-600 dark:text-neutral-400">Connect with friends and share moments.</p>
      <div className="flex gap-3">
        <a
          href="/auth/login"
          className="rounded-full bg-neutral-900 px-5 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Log in
        </a>
        <a
          href="/auth/login?screen_hint=signup"
          className="rounded-full border border-neutral-300 px-5 py-2 font-medium dark:border-neutral-700"
        >
          Sign up
        </a>
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}
