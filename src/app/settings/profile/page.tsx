import { EditProfileForm } from "@/components/edit-profile-form";
import { PageTitle } from "@/components/page-title";
import type { Profile } from "@/interfaces/api";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function EditProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="hidden text-xl font-semibold sm:block">Edit profile</h1>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-900" />}>
        <EditProfile />
      </Suspense>
    </div>
  );
}

async function EditProfile() {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/settings/profile");
  const me = await api<Profile>("/api/users/me");
  return (
    <>
      {/* Phones: title + Back (to your profile if you came from outside) in the header */}
      <PageTitle title="Edit profile" back fallback={`/users/${me.id}`} />
      {/* key: if the profile changes (e.g. saved in another tab), start the form fresh */}
      <EditProfileForm key={`${me.username}|${me.name}|${me.bio}|${me.avatarUrl}`} profile={me} />
    </>
  );
}
