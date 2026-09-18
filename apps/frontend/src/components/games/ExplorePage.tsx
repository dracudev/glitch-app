import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import FilterSidebar from './FilterSidebar';
import GameResultsList from './GameResultsList';
import MobileFilterButton from './MobileFilterButton';
import { setGamesData } from '@/stores/games';
import {
  $filterOptions,
  $selectedFilters,
  loadFilterOptions,
  initializeFromUrl,
} from '@/stores/explore';
import type {
  GameFilterOptions,
  PaginatedGamesResponse,
  GamesQuery,
} from '@glitch/shared-types';

interface ExplorePageProps {
  initialGames: PaginatedGamesResponse | null;
  filterOptions: GameFilterOptions | null;
  initialQuery: GamesQuery;
}

export default function ExplorePage({
  initialGames,
  filterOptions,
  initialQuery,
}: ExplorePageProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const selectedFilters = useStore($selectedFilters);

  useEffect(() => {
    if (initialGames) {
      setGamesData(initialGames);
    }

    if (filterOptions) {
      $filterOptions.set(filterOptions);
    }

    if (window.location.search) {
      initializeFromUrl();
    } else {
      $selectedFilters.set(initialQuery);
    }

    if (!filterOptions) {
      loadFilterOptions();
    }
  }, []);

  return (
    <div className="shell py-8 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl tracking-tight sm:text-3xl">Explore games</h1>
        {selectedFilters.search && (
          <p className="mt-2 text-muted-foreground">
            Search results for "{selectedFilters.search}"
          </p>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[17.5rem_1fr] lg:gap-10">
        {/* Desktop sidebar — pt-6 is the gap under the sticky navbar. */}
        <aside className="hidden lg:block">
          <div className="sticky top-nav pt-6">
            <FilterSidebar />
          </div>
        </aside>

        <main>
          <div className="sticky top-nav z-sticky mb-4 bg-background/90 py-2 backdrop-blur-md lg:hidden">
            <MobileFilterButton
              onClick={() => setIsMobileFilterOpen(true)}
              activeFilterCount={getActiveFilterCount(selectedFilters)}
            />
          </div>

          <GameResultsList />
        </main>
      </div>

      {isMobileFilterOpen && (
        <FilterSidebar isMobile onClose={() => setIsMobileFilterOpen(false)} />
      )}
    </div>
  );
}

function getActiveFilterCount(filters: GamesQuery): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.genreIds?.length) count += filters.genreIds.length;
  if (filters.platformIds?.length) count += filters.platformIds.length;
  if (filters.status) count++;
  return count;
}
