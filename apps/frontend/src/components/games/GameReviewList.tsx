import { useEffect, useRef, useCallback } from 'react';
import { useGameReviews } from '@/hooks/useReviews';
import ReviewCard from '@/components/reviews/ReviewCard';

interface GameReviewListProps {
  gameId: string;
}

export default function GameReviewList({ gameId }: GameReviewListProps) {
  const { reviews, isLoading, fetchGameReviews } = useGameReviews();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading) {
        // Load next page if available
        const currentPage = reviews?.meta.page ?? 1;
        const totalPages = reviews?.meta.totalPages ?? 1;
        const limit = reviews?.meta.limit ?? 10;

        if (currentPage < totalPages) {
          fetchGameReviews(gameId, { page: currentPage + 1, limit });
        }
      }
    },
    [isLoading, fetchGameReviews, reviews, gameId],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleObserver]);

  if (isLoading && (!reviews || reviews.items.length === 0)) {
    return <ReviewListSkeleton />;
  }
  if (!reviews || reviews.items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground">No reviews yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to review this game!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.items.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {/* Infinite Scroll Trigger */}
      <div ref={loadMoreRef} className="flex h-20 items-center justify-center">
        {isLoading && (reviews?.meta.page ?? 1) < (reviews?.meta.totalPages ?? 1) && (
          <div className="flex items-center gap-2 text-foreground-secondary">
            <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading more reviews...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="size-12 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="mb-2 h-5 w-1/4 rounded-md bg-muted" />
              <div className="h-4 w-1/6 rounded-md bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded-md bg-muted" />
            <div className="h-4 w-5/6 rounded-md bg-muted" />
            <div className="h-4 w-4/6 rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
