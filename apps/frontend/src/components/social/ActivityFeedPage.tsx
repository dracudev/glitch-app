import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityFeed } from '@/hooks/useSocial';
import ActivityFeedList from './ActivityFeedList';
import FeedItemSkeleton from './FeedItemSkeleton';
import { Button } from '@/components/ui/Button';

/**
 * One shell for every state this page can be in, so the page rail, the reading
 * column and the heading never drift between the four early returns below.
 */
function PageShell({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={centered ? 'shell py-8 text-center lg:py-10' : 'shell py-8 lg:py-10'}>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl tracking-tight sm:text-3xl lg:mb-8">Your feed</h1>
        {children}
      </div>
    </div>
  );
}

export default function ActivityFeedPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { fetchFeed, feed, isLoading: isFeedLoading, error: feedError } = useActivityFeed();

  useEffect(() => {
    if (isAuthenticated && !feed && !isFeedLoading) {
      fetchFeed({ page: 1, limit: 15 }).catch((err) => {
        console.error('Error fetching initial feed:', err);
      });
    }
  }, [isAuthenticated, fetchFeed, feed, isFeedLoading]);

  if (isAuthLoading) {
    return (
      <PageShell>
        <FeedItemSkeleton />
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell centered>
        <p className="text-muted-foreground">
          <a href="/auth/login?redirect=/feed" className="text-accent underline underline-offset-4">
            Log in
          </a>{' '}
          to see what the people you follow are playing.
        </p>
      </PageShell>
    );
  }

  if (isFeedLoading && !feed) {
    return (
      <PageShell>
        <FeedItemSkeleton />
      </PageShell>
    );
  }

  if (feedError) {
    return (
      <PageShell>
        <div className="rounded-lg border border-error/30 bg-error/10 p-8 text-center">
          <p className="font-semibold text-error">Could not load your feed</p>
          <p className="mt-1 text-sm text-error/80">{feedError}</p>
          <Button
            onClick={() => fetchFeed({ page: 1, limit: 15 })}
            variant="primary"
            size="sm"
            className="mt-5"
          >
            Try again
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ActivityFeedList renders its own empty state when there is nothing to show. */}
      <ActivityFeedList />
    </PageShell>
  );
}
