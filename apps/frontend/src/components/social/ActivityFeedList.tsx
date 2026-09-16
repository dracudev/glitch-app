import { useEffect, useRef, useCallback } from 'react';
import { CircleAlert, Layers } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useSocial';
import FeedItem from './FeedItem';
import FeedItemSkeleton from './FeedItemSkeleton';
import { Button } from '@/components/ui/Button';

interface ActivityFeedListProps {
  initialError?: string | null;
}

export default function ActivityFeedList({ initialError }: ActivityFeedListProps) {
  const { feed, isLoading, error, loadMoreFeed } = useActivityFeed();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && feed?.meta?.hasNext && !isLoading) {
        loadMoreFeed();
      }
    },
    [feed?.meta?.hasNext, isLoading, loadMoreFeed],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px', // Start loading before user reaches the bottom
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  // Show error state
  if (error || initialError) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-8 text-center">
        <div className="mb-4">
          <CircleAlert className="mx-auto size-12 text-error" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Failed to load feed</h3>
        <p className="mb-4 text-base text-foreground-secondary">
          {error || initialError || 'An unexpected error occurred'}
        </p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  // Show loading skeleton on initial load
  if (isLoading && !feed) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <FeedItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!feed || feed.items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mb-4">
          <Layers className="mx-auto size-16 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Your feed is empty</h3>
        <p className="mx-auto mb-6 max-w-md text-base text-foreground-secondary">
          Start following other gamers to see their reviews and activities here.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/games"
            className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Explore games
          </a>
          <a
            href="/users"
            className="inline-flex items-center rounded-md border border-border px-6 py-2 text-base font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Find users
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feed Items */}
      {feed.items.map((activity) => (
        <FeedItem key={activity.id} activity={activity} />
      ))}

      {/* Loading more indicator */}
      {isLoading && feed?.meta?.hasNext && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <FeedItemSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End of feed indicator */}
      {!feed.meta.hasNext && feed.items.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You've reached the end of your feed</p>
        </div>
      )}
    </div>
  );
}
