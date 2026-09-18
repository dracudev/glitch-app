import { useEffect } from 'react';
import type { PaginatedReviewsResponse } from '@glitch/shared-types';

// Components
import ReviewFilters from './ReviewFilters';
import ReviewList from './ReviewList';

// Stores
import { setReviewsData } from '@/stores/reviews';

// Props Interface

interface ReviewsPageProps {
  initialData: PaginatedReviewsResponse | null;
}

export default function ReviewsPage({ initialData }: ReviewsPageProps) {
  // Initialization Effect

  useEffect(() => {
    if (initialData) {
      setReviewsData(initialData);
    }
  }, [initialData]);

  return (
    <div className="shell py-8 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl tracking-tight sm:text-3xl">Recent reviews</h1>
        <p className="mt-2 text-muted-foreground">
          Discover the latest game reviews from the Glitch community
        </p>
      </div>

      <div className="mb-6">
        <ReviewFilters />
      </div>

      <ReviewList initialData={initialData} />
    </div>
  );
}
