// Placeholder shown while posts load
export function PostSkeleton() {
  return (
    <div className="-mx-4 animate-pulse border-b border-neutral-200 pb-3 dark:border-neutral-800">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-2 px-4 pt-3">
        <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
