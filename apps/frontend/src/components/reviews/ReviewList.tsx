import { useEffect, useRef, useCallback } from 'react';
import type { PaginatedReviewsResponse } from '@glitch/shared-types';
import { useReviews } from '@/hooks/useReviews';
import ReviewCard from './ReviewCard';

// ============================================================================
// ReviewList Component
// ============================================================================

interface ReviewListProps {
  /** Server-rendered first page — used for the first client render so it matches SSR. */
  initialData?: PaginatedReviewsResponse | null;
}

/**
 * Infinite scroll list of reviews
 *
 * Displays reviews in a responsive grid with infinite scroll functionality.
 * Uses IntersectionObserver to load more reviews when scrolling.
 *
 * @example
 * ```tsx
 * <ReviewList initialData={initialData} />
 * ```
 */
export default function ReviewList({ initialData = null }: ReviewListProps) {
  const { data: storedData, isLoading, error, loadMoreReviews } = useReviews();
  // Fall back to the server-rendered page until the store is seeded post-hydration.
  const data = storedData ?? initialData;
  const observerTarget = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Infinite Scroll Setup
  // ============================================================================

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;

      // Load more when sentinel is visible and not already loading
      if (target.isIntersecting && !isLoading && data) {
        const hasMorePages = data.meta.page < data.meta.totalPages;
        if (hasMorePages) {
          loadMoreReviews();
        }
      }
    },
    [data, isLoading, loadMoreReviews],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px', // Start loading before reaching the bottom
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // ============================================================================
  // Render States
  // ============================================================================

  // Get reviews items safely
  const reviewItems = data?.items || [];

  // Initial Loading state
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
  if (error && reviewItems.length === 0) {
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
        <h3 className="text-lg font-semibold text-foreground">No reviews found</h3>
        <p className="mt-2 text-sm text-muted-foreground">Be the first to write a review!</p>
      </div>
    );
  }

  // ============================================================================
  // Render Reviews Grid
  // ============================================================================

  const hasMorePages = data && data.meta.page < data.meta.totalPages;

  return (
    <div>
      {/* Reviews Grid - Mobile First: 1 col, MD: 2 cols, LG: 3 cols */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {reviewItems.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoading && reviewItems.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Intersection Observer Sentinel */}
      {hasMorePages && <div ref={observerTarget} className="h-20" />}

      {/* End of Results Message */}
      {!hasMorePages && reviewItems.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You've reached the end of the reviews</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ReviewSkeleton Component
// ============================================================================

/**
 * Loading skeleton for review cards
 */
function ReviewSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-4">
      {/* Game Cover Skeleton */}
      <div className="mb-4 aspect-[3/4] rounded-md bg-muted" />

      {/* Game Title Skeleton */}
      <div className="mb-3 h-5 w-3/4 rounded-md bg-muted" />

      {/* User Info Skeleton */}
      <div className="mb-3 flex items-center gap-2">
        <div className="size-8 rounded-full bg-muted" />
        <div className="h-4 w-24 rounded-md bg-muted" />
      </div>

      {/* Rating Skeleton */}
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="size-4 rounded-md bg-muted" />
        ))}
      </div>

      {/* Content Preview Skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-md bg-muted" />
        <div className="h-3 w-5/6 rounded-md bg-muted" />
      </div>
    </div>
  );
}
