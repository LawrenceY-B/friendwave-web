import { EditProfileForm } from "@/components/edit-profile-form";
import type { Profile } from "@/interfaces/api";
import { api } from "@/lib/api";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function EditProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Edit profile</h1>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-900" />}>
        <EditProfile />
      </Suspense>
    </div>
  );
}

async function EditProfile() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/settings/profile");
  const me = await api<Profile>("/api/users/me");
  // key: if the profile changes (e.g. saved in another tab), start the form fresh
  return <EditProfileForm key={`${me.username}|${me.name}|${me.bio}|${me.avatarUrl}`} profile={me} />;
}
