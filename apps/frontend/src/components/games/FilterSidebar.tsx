import { useState } from 'react';
import { useStore } from '@nanostores/react';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, fieldStyles } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
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

const selectTriggerStyles = [
  fieldStyles,
  'flex cursor-pointer items-center justify-between gap-2 text-left',
].join(' ');

const selectContentStyles =
  'z-popover overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg';

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

  const body = (
    <div className="space-y-6">
      <Button
        onClick={clearFilters}
        variant="outline"
        fullWidth
        size="sm"
        disabled={isDefaultFilters(selectedFilters)}
      >
        Clear all filters
      </Button>

      {loading ? (
        <FilterSkeleton />
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="search-input">Search games</Label>
            <Input
              id="search-input"
              type="text"
              value={selectedFilters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search by title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-by">Sort by</Label>
            <Select.Root
              value={`${selectedFilters.sortBy}-${selectedFilters.sortOrder}`}
              onValueChange={(value: string) => {
                const [sortBy, sortOrder] = value.split('-');
                setFilter('sortBy', sortBy);
                setFilter('sortOrder', sortOrder);
              }}
            >
              <Select.Trigger id="sort-by" className={selectTriggerStyles}>
                <Select.Value />
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className={selectContentStyles} position="popper" sideOffset={4}>
                  <Select.Viewport>
                    <SelectItem value="averageRating-desc">Highest rated</SelectItem>
                    <SelectItem value="averageRating-asc">Lowest rated</SelectItem>
                    <SelectItem value="reviewCount-desc">Most reviewed</SelectItem>
                    <SelectItem value="releaseDate-desc">Recently released</SelectItem>
                    <SelectItem value="releaseDate-asc">Oldest first</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Release status</Label>
            <Select.Root
              value={selectedFilters.status || 'all'}
              onValueChange={(value: string) => {
                setFilter('status', value === 'all' ? undefined : value);
              }}
            >
              <Select.Trigger id="status" className={selectTriggerStyles}>
                <Select.Value />
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className={selectContentStyles} position="popper" sideOffset={4}>
                  <Select.Viewport>
                    <SelectItem value="all">All games</SelectItem>
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

          {filterOptions?.genres && filterOptions.genres.length > 0 && (
            <CollapsibleSection title="Genres" count={selectedFilters.genreIds?.length}>
              <div className="max-h-64 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
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

          {filterOptions?.platforms && filterOptions.platforms.length > 0 && (
            <CollapsibleSection title="Platforms" count={selectedFilters.platformIds?.length}>
              <Input
                type="text"
                value={platformSearch}
                onChange={(e) => setPlatformSearch(e.target.value)}
                placeholder="Filter platforms..."
                aria-label="Filter platforms"
                className="mb-2"
              />
              <div className="max-h-64 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
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
      <Dialog open onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent placement="bottom" aria-describedby={undefined} className="p-6">
          <DialogTitle className="mb-5 flex items-center gap-2 font-sans text-sm font-semibold">
            <Filter className="size-4" aria-hidden="true" />
            Filters
          </DialogTitle>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Filter className="size-4" aria-hidden="true" />
        Filters
      </h2>
      {body}
    </Card>
  );
}

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
    <Collapsible.Root defaultOpen={defaultOpen} className="group">
      <Collapsible.Trigger className="flex w-full cursor-pointer items-center justify-between py-1 text-left text-sm font-medium text-foreground transition-colors hover:text-primary">
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {countNum > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
              <span className="sr-only">{`${countNum} selected`}</span>
              <span aria-hidden>{countNum}</span>
            </span>
          )}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-3">{children}</Collapsible.Content>
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
    <div className="flex min-w-0 items-center gap-3">
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-border-strong bg-transparent transition-colors hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <Checkbox.Indicator>
          <Check className="size-3 text-primary-foreground" strokeWidth={3} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label
        htmlFor={id}
        className="min-w-0 flex-1 cursor-pointer break-words text-sm text-foreground-secondary transition-colors hover:text-foreground"
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
      className="relative flex cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground"
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-2">
        <Check className="size-4 text-primary" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

function FilterSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-8 rounded-md bg-muted" />
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
