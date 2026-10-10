"use client";

import type { Profile } from "@/interfaces/api";
import { updateProfile } from "@/lib/actions";
import { AVATAR_MAX_SIDE, MAX_BIO, MAX_IMAGE_BYTES, MAX_NAME, USERNAME_HINT } from "@/lib/limits";
import { shrinkImage } from "@/lib/resize-image";
import { Camera } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Avatar } from "./avatar";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 invalid:border-red-400 dark:border-neutral-700";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, {});
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const preview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : null), [avatar]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  // Only what changed is sent
  const changes = {
    ...(name.trim() !== profile.name && { name }),
    ...(username !== profile.username && { username }),
    ...(bio !== profile.bio && { bio }),
  };
  const hasChanges = Object.keys(changes).length > 0 || avatar !== null;

  async function pickAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPickError("Choose an image file.");
    // Shrunk in the browser first: a camera photo becomes ~100 KB, so it fits easily
    // through the Server Action (Vercel caps requests at 4.5 MB)
    const small = await shrinkImage(file, AVATAR_MAX_SIDE);
    if (small.size > MAX_IMAGE_BYTES) return setPickError("That picture couldn't be made small enough (max 5 MB).");
    setPickError(null);
    setAvatar(small);
  }

  function submit() {
    const formData = new FormData();
    Object.entries(changes).forEach(([key, value]) => formData.append(key, value));
    if (avatar) formData.append("avatar", avatar, avatar.name);
    formAction(formData);
  }

  return (
    <form action={submit} className="space-y-5">
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="New profile picture" className="size-22 rounded-full object-cover" />
        ) : (
          <Avatar user={profile} size="lg" />
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900">
          <Camera className="size-4" />
          Change picture
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void pickAvatar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* Short labels; hints are linked with aria-describedby so screen readers
          announce "Username" as the name and the hint as extra help */}
      <div className="space-y-1">
        <label htmlFor="profile-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={MAX_NAME}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="profile-username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="profile-username"
          aria-describedby="profile-username-hint"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          pattern="[A-Za-z0-9._]{3,30}"
          title={USERNAME_HINT}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
        />
        <p id="profile-username-hint" className="text-xs text-neutral-500">
          {USERNAME_HINT}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="profile-bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="profile-bio"
          aria-describedby="profile-bio-count"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO}
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <p id="profile-bio-count" className="text-right text-xs text-neutral-500">
          {bio.length}/{MAX_BIO}
        </p>
      </div>

      {/* Two independent messages: a file-picking problem and the last save's result.
          Showing only one meant a stale save error could hide a new picking error. */}
      {pickError && (
        <p role="alert" className="text-sm text-red-600">
          {pickError}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !hasChanges}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <Link href={`/users/${profile.id}`} className="text-sm text-neutral-500 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
