import { useEffect } from 'react';
import type { PaginatedReviewsResponse } from '@glitch/shared-types';

// Components
import ReviewFilters from './ReviewFilters';
import ReviewList from './ReviewList';

// Stores
import { setReviewsData } from '@/stores/reviews';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewsPageProps {
  initialData: PaginatedReviewsResponse | null;
}

// ============================================================================
// ReviewsPage Component
// ============================================================================

/**
 * Main reviews page component (React Island)
 *
 * Hydrated by Astro with server-rendered initial data.
 * Initializes the global store and renders filters + review list.
 *
 * @example
 * ```tsx
 * <ReviewsPage initialData={reviewsData} client:load />
 * ```
 */
export default function ReviewsPage({ initialData }: ReviewsPageProps) {
  // ============================================================================
  // Initialization Effect
  // ============================================================================

  useEffect(() => {
    // Hydrate global store with server-rendered data
    if (initialData) {
      setReviewsData(initialData);
    }
  }, [initialData]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="shell py-8 lg:py-10">
      {/* Page Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl tracking-tight sm:text-3xl">Recent reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Discover the latest game reviews from the Glitch community
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <ReviewFilters />
      </div>

      {/* Reviews List with Infinite Scroll */}
      <ReviewList initialData={initialData} />
    </div>
  );
}
