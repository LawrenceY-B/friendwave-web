import type { UserSummary } from "@/interfaces/api";
import Image from "next/image";

const SIZES = { sm: 32, md: 40, lg: 88 } as const;

interface AvatarProps {
  user: UserSummary | null;
  size?: keyof typeof SIZES;
  // true shows a green "online" dot (chat partners only; see usePresence)
  online?: boolean;
}

export function Avatar({ user, size = "md", online }: AvatarProps) {
  const px = SIZES[size];
  const picture = user?.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt={user.username}
      width={px}
      height={px}
      // API images redirect to short-lived S3 links, so skip Next's image optimizer
      unoptimized
      className="shrink-0 rounded-full bg-neutral-200 object-cover dark:bg-neutral-800"
      style={{ width: px, height: px }}
    />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300"
      style={{ width: px, height: px, fontSize: px / 2.5 }}
    >
      {user?.username?.[0] ?? "?"}
    </span>
  );

  if (!online) return picture;
  return (
    <span className="relative inline-flex shrink-0">
      {picture}
      <span
        data-testid="online-dot"
        className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-950"
      />
      <span className="sr-only">Online</span>
    </span>
  );
}
