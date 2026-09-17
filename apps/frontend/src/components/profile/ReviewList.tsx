import { MessageSquare, ThumbsUp } from 'lucide-react';
import { useUserReviews } from '@/hooks/useReviews';
import StarRating from '@/components/ui/StarRating';
import { useEffect, useRef, useCallback } from 'react';
import type { ReviewResponse } from '@glitch/shared-types';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewListProps {
  userId: string;
}

// ============================================================================
// ReviewList Component
// ============================================================================

/**
 * Infinite scroll list of user reviews
 *
 * @example
 * ```tsx
 * <ReviewList userId="user-123" />
 * ```
 */
export default function ReviewList({ userId }: ReviewListProps) {
  const { reviews, isLoading, error, fetchUserReviews, fetchMoreUserReviews } = useUserReviews();
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPage = useRef(1);
  const hasMore = useRef(true);
  const lastUserId = useRef<string | null>(null);

  // Initial fetch - only when userId changes
  useEffect(() => {
    if (lastUserId.current !== userId) {
      currentPage.current = 1;
      hasMore.current = true;
      fetchUserReviews(userId, { page: 1, limit: 10 });
      lastUserId.current = userId;
    }
  }, [userId, fetchUserReviews]);

  // Infinite scroll callback
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading && hasMore.current) {
        const nextPage = currentPage.current + 1;
        currentPage.current = nextPage;

        fetchMoreUserReviews(userId, { page: nextPage, limit: 10 }).then((response) => {
          // If we received fewer results than the limit, we've reached the end
          if (response && response.items.length < 10) {
            hasMore.current = false;
          }
        });
      }
    },
    [userId, isLoading, fetchMoreUserReviews],
  );

  // Set up IntersectionObserver
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Get reviews items safely
  const reviewItems = reviews?.items || [];

  // Loading state
  if (isLoading && reviewItems.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-8 text-center">
        <h3 className="text-lg font-semibold text-error">Failed to load reviews</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Empty state
  if (reviewItems.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground">No reviews yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">This user hasn't reviewed any games</p>
      </div>
    );
  }

  // Review list
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {reviewItems.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore.current && <div ref={observerTarget} className="h-10" />}

      {/* Loading more indicator */}
      {isLoading && reviewItems.length > 0 && (
        <div className="flex justify-center py-4">
          <svg
            className="size-6 animate-spin text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore.current && reviewItems.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">You've reached the end</p>
      )}
    </>
  );
}

// ============================================================================
// ReviewCard Component
// ============================================================================

interface ReviewCardProps {
  review: ReviewResponse;
}

function ReviewCard({ review }: ReviewCardProps) {
  const maxLength = 200;
  const truncatedContent =
    review.content.length > maxLength ? review.content.slice(0, maxLength) + '...' : review.content;

  return (
    <a
      href={`/reviews/${review.id}`}
      className="block rounded-lg border border-border bg-card p-4 interactive-surface hover:border-border-hover"
    >
      <div className="flex gap-4">
        {/* Game Cover */}
        <div className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          <img
            src={review.game.coverImage || '/images/game-placeholder.svg'}
            alt={review.game.title}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Review Content — `min-w-0` lets the rating row shrink instead of
            forcing this column wider than the card. */}
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground">
            {review.game.title}
          </h3>

          {/* Rating — wraps so a narrow column drops the date onto its own line
              instead of crushing the stars to fit beside it. */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StarRating value={review.rating} size={16} />
            <span className="font-mono text-sm text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Review Text */}
          <p className="whitespace-pre-wrap text-sm text-foreground">{truncatedContent}</p>

          {/* Stats */}
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="size-3 fill-current" aria-hidden="true" />
              <span className="font-mono">{review.stats.likesCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3 fill-current" aria-hidden="true" />
              <span className="font-mono">{review.stats.commentsCount}</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ============================================================================
// ReviewSkeleton Component
// ============================================================================

function ReviewSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="flex gap-4">
        {/* Cover skeleton */}
        <div className="aspect-[3/4] w-20 shrink-0 rounded-md bg-muted" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded-md bg-muted" />
          <div className="h-4 w-1/3 rounded-md bg-muted" />
          <div className="space-y-1 pt-1">
            <div className="h-3 w-full rounded-md bg-muted" />
            <div className="h-3 w-full rounded-md bg-muted" />
            <div className="h-3 w-3/4 rounded-md bg-muted" />
          </div>
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-12 rounded-md bg-muted" />
            <div className="h-3 w-12 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
