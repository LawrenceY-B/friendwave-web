// Placeholder shown while posts load
export function PostSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-3 p-3">
        <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
