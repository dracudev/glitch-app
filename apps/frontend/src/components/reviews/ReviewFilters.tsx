import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { useReviews } from '@/hooks/useReviews';

// ============================================================================
// Types
// ============================================================================

type SortOption = {
  value: string;
  label: string;
  sortBy: 'createdAt' | 'rating' | 'likesCount';
  sortOrder: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  {
    value: 'recent',
    label: 'Most recent',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  {
    value: 'popular',
    label: 'Most popular',
    sortBy: 'likesCount',
    sortOrder: 'desc',
  },
  {
    value: 'highest-rated',
    label: 'Highest rated',
    sortBy: 'rating',
    sortOrder: 'desc',
  },
  {
    value: 'lowest-rated',
    label: 'Lowest rated',
    sortBy: 'rating',
    sortOrder: 'asc',
  },
];

// ============================================================================
// ReviewFilters Component
// ============================================================================

/**
 * Filter controls for reviews list
 *
 * Provides sort dropdown to filter reviews by different criteria.
 * Uses useReviews hook to fetch data with new query params.
 *
 * @example
 * ```tsx
 * <ReviewFilters />
 * ```
 */
export default function ReviewFilters() {
  const { fetchReviews, isLoading } = useReviews();
  const [selectedSort, setSelectedSort] = useState<string>('recent');

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSortChange = async (value: string) => {
    setSelectedSort(value);

    const sortOption = SORT_OPTIONS.find((opt) => opt.value === value);
    if (!sortOption) return;

    // Fetch reviews with new sort parameters
    await fetchReviews({
      page: 1,
      limit: 20,
      sortBy: sortOption.sortBy,
      sortOrder: sortOption.sortOrder,
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
      {/* Filter Label */}
      <div className="flex items-center gap-2">
        <Filter className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Sort by</span>
      </div>

      {/* Sort Dropdown */}
      <div className="w-full sm:w-auto">
        <Select
          ariaLabel="Sort reviews"
          value={selectedSort}
          onValueChange={handleSortChange}
          options={SORT_OPTIONS}
          disabled={isLoading}
        />
      </div>
    </Card>
  );
}
