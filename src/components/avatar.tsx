import type { UserSummary } from "@/interfaces/api";
import Image from "next/image";

const SIZES = { sm: 32, md: 40, lg: 88 } as const;

export function Avatar({ user, size = "md" }: { user: UserSummary | null; size?: keyof typeof SIZES }) {
  const px = SIZES[size];
  if (user?.avatarUrl) {
    return (
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
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300"
      style={{ width: px, height: px, fontSize: px / 2.5 }}
    >
      {user?.username?.[0] ?? "?"}
    </span>
  );
}
