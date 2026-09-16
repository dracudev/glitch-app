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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && reviewItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-full mb-4">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-error mb-2 font-semibold">Failed to load reviews</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (reviewItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-full mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-foreground mb-2 font-semibold">No reviews found</p>
        <p className="text-muted-foreground text-sm">Be the first to write a review!</p>
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
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {reviewItems.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoading && reviewItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 mt-6">
          {[1, 2, 3].map((i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Intersection Observer Sentinel */}
      {hasMorePages && <div ref={observerTarget} className="h-20" />}

      {/* End of Results Message */}
      {!hasMorePages && reviewItems.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted text-sm">You've reached the end of the reviews</p>
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
    <div className="bg-card rounded-lg border border-border p-4 animate-pulse">
      {/* Game Cover Skeleton */}
      <div className="aspect-[3/4] bg-muted rounded-md mb-4" />

      {/* Game Title Skeleton */}
      <div className="h-5 bg-muted rounded w-3/4 mb-3" />

      {/* User Info Skeleton */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-muted rounded-full" />
        <div className="h-4 bg-muted rounded w-24" />
      </div>

      {/* Rating Skeleton */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-4 h-4 bg-muted rounded" />
        ))}
      </div>

      {/* Content Preview Skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}
