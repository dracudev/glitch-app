import { useState } from 'react';
import { useStore } from '@nanostores/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown, Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  $filterOptions,
  $filterOptionsLoading,
  $selectedFilters,
  setFilter,
  toggleArrayFilter,
  clearFilters,
} from '@/stores/explore';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'RELEASED', label: 'Released' },
  { value: 'EARLY_ACCESS', label: 'Early Access' },
  { value: 'ALPHA', label: 'Alpha' },
  { value: 'BETA', label: 'Beta' },
  { value: 'RUMORED', label: 'Rumored' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DELISTED', label: 'Delisted' },
];

interface FilterSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export default function FilterSidebar({ isMobile = false, onClose }: FilterSidebarProps) {
  const filterOptions = useStore($filterOptions);
  const loading = useStore($filterOptionsLoading);
  const selectedFilters = useStore($selectedFilters);
  const [platformSearch, setPlatformSearch] = useState('');

  const platformQuery = platformSearch.trim().toLowerCase();
  const visiblePlatforms = (filterOptions?.platforms ?? []).filter(
    (platform) => !platformQuery || platform.name.toLowerCase().includes(platformQuery),
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" aria-hidden="true" />
          Filters
        </h2>
        {isMobile && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Clear Filters Button */}
      <Button
        onClick={clearFilters}
        variant="outline"
        fullWidth
        size="sm"
        disabled={isDefaultFilters(selectedFilters)}
      >
        Clear All Filters
      </Button>

      {loading ? (
        <FilterSkeleton />
      ) : (
        <>
          {/* Search Filter */}
          <div>
            <label htmlFor="search-input" className="block text-sm font-medium mb-2">
              Search Games
            </label>
            <input
              id="search-input"
              type="text"
              value={selectedFilters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search by title..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search games by title"
            />
          </div>

          {/* Sort By  */}
          <div className="space-y-2">
            <div>
              <Select.Root
                value={`${selectedFilters.sortBy}-${selectedFilters.sortOrder}`}
                onValueChange={(value: string) => {
                  const [sortBy, sortOrder] = value.split('-');
                  setFilter('sortBy', sortBy);
                  setFilter('sortOrder', sortOrder);
                }}
              >
                <Select.Trigger
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
                  aria-label="Sort games by"
                >
                  <Select.Value />
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content className="z-[60] rounded-lg border border-border bg-card shadow-lg">
                    <Select.Viewport className="p-1">
                      <SelectItem value="averageRating-desc">Highest Rated</SelectItem>
                      <SelectItem value="averageRating-asc">Lowest Rated</SelectItem>
                      <SelectItem value="reviewCount-desc">Most Reviewed</SelectItem>
                      <SelectItem value="releaseDate-desc">Recently Released</SelectItem>
                      <SelectItem value="releaseDate-asc">Oldest First</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* Game Status */}
          <div className="space-y-2">
            <div>
              <Select.Root
                value={selectedFilters.status || 'all'}
                onValueChange={(value: string) => {
                  setFilter('status', value === 'all' ? undefined : value);
                }}
              >
                <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Select.Value />
                  <ChevronDown className="h-4 w-4" />
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content className="z-[60] rounded-lg border border-border bg-card shadow-lg">
                    <Select.Viewport className="p-1">
                      <SelectItem value="all">All Games</SelectItem>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* Separator */}
          <div className="my-4 border-t border-border" aria-hidden="true" />

          {/* Genres */}
          {filterOptions?.genres && filterOptions.genres.length > 0 && (
            <CollapsibleSection title="Genres" count={selectedFilters.genreIds?.length}>
              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden pr-1">
                {filterOptions.genres.map((genre) => (
                  <CheckboxItem
                    key={genre.id}
                    id={`genre-${genre.id}`}
                    label={genre.name}
                    checked={selectedFilters.genreIds?.includes(genre.id) || false}
                    onCheckedChange={() => toggleArrayFilter('genreIds', genre.id)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Platforms */}
          {filterOptions?.platforms && filterOptions.platforms.length > 0 && (
            <CollapsibleSection title="Platforms" count={selectedFilters.platformIds?.length}>
              <input
                type="text"
                value={platformSearch}
                onChange={(e) => setPlatformSearch(e.target.value)}
                placeholder="Filter platforms..."
                className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter platforms"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden pr-1">
                {visiblePlatforms.map((platform) => (
                  <CheckboxItem
                    key={platform.id}
                    id={`platform-${platform.id}`}
                    label={platform.name}
                    checked={selectedFilters.platformIds?.includes(platform.id) || false}
                    onCheckedChange={() => toggleArrayFilter('platformIds', platform.id)}
                  />
                ))}
                {visiblePlatforms.length === 0 && (
                  <p className="text-sm text-muted-foreground">No platforms match</p>
                )}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Dialog.Root open onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background p-6 shadow-lg animate-slide-up max-h-[90vh] overflow-y-auto"
            aria-describedby="filter-description"
          >
            <Dialog.Description id="filter-description" className="sr-only">
              Filter and sort games by various criteria
            </Dialog.Description>
            {content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return <div className="rounded-lg border border-border bg-card p-6">{content}</div>;
}

// Helper Components
function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const countNum = typeof count === 'number' ? count : 0;

  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:opacity-80">
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {/* Badge */}
          {countNum > 0 && (
            <span
              role="status"
              aria-label={`${countNum} selected`}
              title={`${countNum} selected`}
              className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white"
            >
              <span className="sr-only">{`${countNum} selected`}</span>
              <span aria-hidden>{countNum}</span>
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform" />
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-2">
        <div className="pl-3 ml-1 border-l border-border space-y-2">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function CheckboxItem({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 pr-1">
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-5 w-5 shrink-0 rounded border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      >
        <Checkbox.Indicator>
          <Check className="h-4 w-4 text-primary-foreground" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label
        htmlFor={id}
        className="text-sm cursor-pointer hover:opacity-80 break-words min-w-0 flex-1"
      >
        {label}
      </label>
    </div>
  );
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Select.Item
      value={value}
      className="relative flex items-center rounded px-8 py-2 text-sm hover:bg-accent focus:bg-accent outline-none cursor-pointer"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-2">
        <Check className="h-4 w-4" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

function FilterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function isDefaultFilters(filters: any): boolean {
  return (
    filters.page === 1 &&
    filters.sortBy === 'averageRating' &&
    filters.sortOrder === 'desc' &&
    (!filters.genreIds || filters.genreIds.length === 0) &&
    (!filters.platformIds || filters.platformIds.length === 0) &&
    !filters.search &&
    !filters.status
  );
}
