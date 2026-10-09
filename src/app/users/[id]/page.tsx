import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import type { Post, Profile } from "@/interfaces/api";
import { api, ApiError, apiPage } from "@/lib/api";
import { plural } from "@/lib/format";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default function ProfilePage({ params }: PageProps<"/users/[id]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileView params={params} />
    </Suspense>
  );
}

async function ProfileView({ params }: { params: PageProps<"/users/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/.test(id)) notFound();

  let profile: Profile;
  let posts: Post[];
  try {
    [profile, { items: posts }] = await Promise.all([
      api<Profile>(`/api/users/${id}`),
      apiPage<Post>(`/api/users/${id}/posts?limit=30`),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="space-y-8">
      <section className="flex gap-6">
        <Avatar user={profile} size="lg" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-semibold">{profile.username}</h1>
            {!profile.isMe && <FollowButton userId={profile.id} isFollowing={profile.isFollowing} />}
          </div>
          <ul className="flex gap-5 text-sm">
            <li>
              <b>{profile.postCount}</b> {profile.postCount === 1 ? "post" : "posts"}
            </li>
            <li>
              <b>{profile.followerCount}</b> {profile.followerCount === 1 ? "follower" : "followers"}
            </li>
            <li>
              <b>{profile.followingCount}</b> following
            </li>
          </ul>
          <div className="text-sm">
            <p className="font-medium">{profile.name}</p>
            {profile.bio && <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-400">{profile.bio}</p>}
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">No posts yet.</p>
      ) : (
        <section aria-label={plural(posts.length, "post")} className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <div key={post.id} className="relative aspect-square overflow-hidden bg-neutral-200 dark:bg-neutral-800">
              <Image
                src={post.images[0]}
                alt={post.caption || "Post"}
                fill
                unoptimized
                sizes="200px"
                className="object-cover"
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse gap-6">
      <div className="size-22 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
