import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useGames } from '@/hooks/useGames';
import { $selectedFilters, setPage, clearFilters } from '@/stores/explore';
import GameCard from './GameCard.tsx';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { GameResponse } from '@glitch/shared-types';

export default function GameResultsList() {
  const selectedFilters = useStore($selectedFilters);
  const { data, isLoading, error, fetchGames } = useGames();

  useEffect(() => {
    fetchGames(selectedFilters);
  }, [selectedFilters, fetchGames]);

  // Loading state (initial load)
  if (isLoading && !data?.data.length) {
    return (
      <div>
        <ResultsHeader isLoading />
        <GameGridSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Failed to Load Games</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchGames(selectedFilters)} size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!data?.data.length) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Games Found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Try adjusting your filters or search terms
        </p>
        <Button onClick={clearFilters} size="sm">
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div>
      <ResultsHeader total={data.total} page={data.page} totalPages={data.totalPages} />

      {/* Game Grid  */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.data.map((game: GameResponse) => (
          <GameCard key={game.game.id} game={game} />
        ))}
      </div>

      <Pagination page={data.page} totalPages={data.totalPages} />
    </div>
  );
}

// Results Header Component
function ResultsHeader({
  total,
  page,
  totalPages,
  isLoading = false,
}: {
  total?: number;
  page?: number;
  totalPages?: number;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {total !== undefined && (
          <>
            Showing <span className="font-semibold text-foreground">{total}</span>{' '}
            {total === 1 ? 'game' : 'games'}
            {page && totalPages && (
              <span className="ml-2">
                • Page {page} of {totalPages}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (!totalPages || totalPages <= 1) return null;

  const goTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <Button onClick={() => goTo(page - 1)} disabled={page <= 1} size="sm" variant="outline">
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        size="sm"
        variant="outline"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

// Loading Skeleton
function GameGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-lg bg-muted mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
