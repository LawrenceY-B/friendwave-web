import { StoryViewer } from "@/components/story-viewer";
import type { Profile, StoryGroup } from "@/interfaces/api";
import { api } from "@/lib/api";
import Link from "next/link";
import { Suspense } from "react";

// /stories?start=<userId>: watch stories, starting with that person's
export default function StoriesPage({ searchParams }: PageProps<"/stories">) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-black" />}>
      <Stories searchParams={searchParams} />
    </Suspense>
  );
}

async function Stories({ searchParams }: { searchParams: PageProps<"/stories">["searchParams"] }) {
  const { start } = await searchParams;
  const [me, groups] = await Promise.all([api<Profile>("/api/users/me"), api<StoryGroup[]>("/api/stories")]);

  if (groups.length === 0) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="font-medium">No stories right now.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Back to your feed
        </Link>
      </div>
    );
  }

  const startIndex = Math.max(
    0,
    groups.findIndex((g) => g.author.id === start)
  );
  // key: opening a different person's stories starts a fresh viewer
  return <StoryViewer key={String(start)} groups={groups} startIndex={startIndex} meId={me.id} />;
}
