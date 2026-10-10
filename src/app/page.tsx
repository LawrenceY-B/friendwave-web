import { NewPostsPill } from "@/components/new-posts-pill";
import { FeedGate } from "@/components/onboarding-suggestions";
import { PostCard } from "@/components/post-card";
import { PostSkeleton } from "@/components/post-skeleton";
import { StoriesBar } from "@/components/stories-bar";
import type { Post, Profile, StoryGroup, Suggestion } from "@/interfaces/api";
import { api, apiPage } from "@/lib/api";
import { getSession } from "@/lib/session";
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
  const session = await getSession();
  if (!session) return <Landing />;

  const { cursor } = await searchParams;
  const query = typeof cursor === "string" && /^[0-9a-f]{24}$/.test(cursor) ? `?cursor=${cursor}` : "";
  // Stories only on the first page of the feed; all requests run in parallel
  const [{ items, nextCursor }, stories, me] = await Promise.all([
    apiPage<Post>(`/api/feed${query}`),
    query ? null : api<StoryGroup[]>("/api/stories"),
    api<Profile>("/api/users/me"),
  ]);
  const suggestions = items.length === 0 && !query ? await api<Suggestion[]>("/api/users/suggestions?limit=10") : null;

  return (
    <div className="space-y-6">
      {/* "↑ New posts" when someone you follow posts while you're here */}
      {!query && <NewPostsPill />}
      {stories && <StoriesBar groups={stories} meId={me.id} />}
      {/* A brand-new user with an empty feed picks people to follow first (FeedGate) */}
      <FeedGate startEmpty={items.length === 0 && !query} suggestions={suggestions ?? []}>
        {items.length === 0 ? (
          query ? (
            <p className="py-20 text-center text-neutral-500">No more posts.</p>
          ) : (
            <div className="space-y-4 py-6">
              <p className="text-center text-neutral-500">
                Your feed is empty.{" "}
                <Link href="/search" className="text-blue-600 hover:underline">
                  Find people to follow
                </Link>
                .
              </p>
            </div>
          )
        ) : (
          items.map((post) => <PostCard key={post.id} post={post} meId={me.id} />)
        )}
        {nextCursor && (
          <Link
            href={`/?cursor=${nextCursor}`}
            className="block rounded-lg border border-neutral-200 py-2 text-center text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            Older posts
          </Link>
        )}
      </FeedGate>
    </div>
  );
}

function Landing() {
  return (
    <section className="flex flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Friendwave</h1>
      <p className="max-w-sm text-neutral-600 dark:text-neutral-400">Connect with friends and share moments.</p>
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Auth0 routes (proxy.ts) need a full page load */}
        <a
          href="/auth/login"
          className="rounded-full bg-neutral-900 px-5 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Log in
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Auth0 routes (proxy.ts) need a full page load */}
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
