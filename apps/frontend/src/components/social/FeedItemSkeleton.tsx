export default function FeedItemSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-6">
      {/* Header skeleton */}
      <div className="mb-4 flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="size-10 rounded-full bg-muted" />

        {/* User info skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-md bg-muted" />
          <div className="h-3 w-20 rounded-md bg-muted" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex gap-4">
        {/* Image skeleton */}
        <div className="h-28 w-20 shrink-0 rounded-md bg-muted" />

        {/* Text content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-md bg-muted" />
            <div className="h-3 w-5/6 rounded-md bg-muted" />
            <div className="h-3 w-4/6 rounded-md bg-muted" />
          </div>
          <div className="h-3 w-28 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
