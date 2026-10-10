import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { FollowingMenu } from "@/components/following-menu";
import { PeopleSheet } from "@/components/people-sheet";
import type { Post, Profile, StoryGroup } from "@/interfaces/api";
import { openChat } from "@/lib/actions";
import { api, ApiError, apiPage } from "@/lib/api";
import { plural } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default function ProfilePage({ params }: PageProps<"/users/[id]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileView params={params} />
    </Suspense>
  );
}

async function loadProfile(id: string) {
  try {
    return await Promise.all([
      api<Profile>(`/api/users/${id}`),
      apiPage<Post>(`/api/users/${id}/posts?limit=30`),
      // Live stories (yours and people you follow): used for the ring around the picture
      api<StoryGroup[]>("/api/stories"),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

const secondaryButton =
  "flex w-full items-center justify-center rounded-lg bg-neutral-200 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700";

async function ProfileView({ params }: { params: PageProps<"/users/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/.test(id)) notFound();
  const [profile, { items: posts }, stories] = await loadProfile(id);
  const hasStory = stories.some((group) => group.author.id === profile.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <h1 className="truncate text-xl font-semibold">{profile.username}</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-6">
          {hasStory ? (
            // Coloured ring = they have a live story; tap to watch it
            <Link
              href={`/stories?start=${profile.id}`}
              aria-label={`Watch ${profile.username}'s story`}
              className="shrink-0 rounded-full bg-linear-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.75"
            >
              <span className="block rounded-full bg-neutral-50 p-0.75 dark:bg-black">
                <Avatar user={profile} size="lg" />
              </span>
            </Link>
          ) : (
            <Avatar user={profile} size="lg" />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate font-semibold">{profile.name}</p>
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="font-semibold">{profile.postCount.toLocaleString("en")}</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {profile.postCount === 1 ? "post" : "posts"}
                </span>
              </div>
              <PeopleSheet userId={profile.id} which="followers" count={profile.followerCount} />
              <PeopleSheet userId={profile.id} which="following" count={profile.followingCount} />
            </div>
          </div>
        </div>

        {profile.bio && <p className="text-sm whitespace-pre-line">{profile.bio}</p>}

        <div className="flex gap-2">
          {profile.isMe ? (
            <Link href="/settings/profile" className={secondaryButton}>
              Edit profile
            </Link>
          ) : (
            <>
              <div className="flex-1">
                <FollowingMenu userId={profile.id} username={profile.username} isFollowing={profile.isFollowing} />
              </div>
              {/* A Server Action as a form action: works even before JavaScript loads */}
              <form action={openChat.bind(null, profile.id)} className="flex-1">
                <button type="submit" className={secondaryButton}>
                  Message
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">No posts yet.</p>
      ) : (
        <section aria-label={plural(posts.length, "post")} className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            // Opens the post on top of this profile
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="relative aspect-square overflow-hidden bg-neutral-200 dark:bg-neutral-800"
            >
              <Image
                src={post.images[0]}
                alt={post.caption || "Post"}
                fill
                unoptimized
                sizes="200px"
                className="object-cover"
              />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-6">
      <div className="size-22 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
