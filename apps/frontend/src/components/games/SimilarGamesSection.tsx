import type { GameResponse } from '@glitch/shared-types';
import { useSimilarGames } from '@/hooks/useGames';
import GameCard from './GameCard';

interface SimilarGamesSectionProps {
  /** Server-rendered similar games. Used for the first paint so the SSR HTML
   * carries real content; the store is still the source of truth after mount. */
  similarGames?: GameResponse[];
}

export default function SimilarGamesSection({
  similarGames: initialSimilarGames,
}: SimilarGamesSectionProps) {
  const { games: storeSimilarGames } = useSimilarGames();
  const similarGames = initialSimilarGames ?? storeSimilarGames;

  // Only a genuinely empty store (e.g. client-side navigation) hits this branch.
  if (!similarGames) {
    return <SimilarGamesSkeleton />;
  }

  if (similarGames.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-xl font-semibold">Similar games</h2>

      {/* Mobile: Horizontal Scroll */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 no-scrollbar lg:hidden">
        {similarGames.map((game) => (
          <div key={game.game.id} className="w-48 shrink-0 snap-start">
            <GameCard game={game} />
          </div>
        ))}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden grid-cols-3 gap-6 lg:grid xl:grid-cols-6">
        {similarGames.map((game) => (
          <GameCard key={game.game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

function SimilarGamesSkeleton() {
  return (
    <section className="mb-12 animate-pulse">
      <div className="mb-6 h-8 w-48 rounded-md bg-muted" />

      {/* Mobile: horizontal scroll — same rail, card widths and snap points. */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 no-scrollbar lg:hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-48 shrink-0 snap-start">
            <GameCardSkeleton />
          </div>
        ))}
      </div>

      {/* Desktop: grid — 3 columns at lg, 6 at xl, matching the real grid. */}
      <div className="hidden grid-cols-3 gap-6 lg:grid xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

function GameCardSkeleton() {
  return (
    <div>
      {/* Cover — same 3/4 ratio and surface treatment as GameCard. */}
      <div className="aspect-[3/4] rounded-lg border border-border bg-card" />
      {/* Info — the title reserves two lines, the meta row one. */}
      <div className="mt-3 space-y-1">
        <div className="h-10 rounded-md bg-muted" />
        <div className="h-4 w-2/3 rounded-md bg-muted" />
      </div>
    </div>
  );
}
