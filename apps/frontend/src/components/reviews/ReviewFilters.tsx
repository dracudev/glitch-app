import { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { fieldStyles } from '@/components/ui/Input';
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

const selectTriggerStyles = [
  fieldStyles,
  'flex cursor-pointer items-center justify-between gap-2 text-left',
].join(' ');

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
        <Select.Root value={selectedSort} onValueChange={handleSortChange} disabled={isLoading}>
          <Select.Trigger
            className={[selectTriggerStyles, 'w-full sm:w-auto'].join(' ')}
            aria-label="Sort reviews"
          >
            <Select.Value />
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-popover overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {SORT_OPTIONS.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-2">
                      <Check className="size-4 text-primary" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </Card>
  );
}
