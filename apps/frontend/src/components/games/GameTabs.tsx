import * as Tabs from '@radix-ui/react-tabs';
import type { GameDetail } from '@glitch/shared-types';
import { useGameDetail } from '@/hooks/useGames';
import GameReviewList from './GameReviewList';

const tabTriggerStyles =
  'cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground';

interface GameTabsProps {
  /** Server-rendered for the first paint; the store wins after mount. */
  game?: GameDetail;
}

export default function GameTabs({ game: initialGame }: GameTabsProps) {
  const { game: storeGame } = useGameDetail();
  // Store-first only when it holds THIS game; it can still hold the previous one during navigation.
  const storeIsThisGame =
    storeGame != null && (initialGame == null || storeGame.game.slug === initialGame.game.slug);
  const game = storeIsThisGame ? storeGame : initialGame;

  // Only a genuinely empty store (e.g. client-side navigation) hits this branch.
  if (!game) {
    return <GameTabsSkeleton />;
  }

  return (
    <Tabs.Root defaultValue="about" className="mb-12">
      <Tabs.List className="mb-6 flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
        <Tabs.Trigger value="about" className={tabTriggerStyles}>
          About
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={tabTriggerStyles}>
          Reviews
        </Tabs.Trigger>
        <Tabs.Trigger value="details" className={tabTriggerStyles}>
          Details
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="about">
        <p className="prose-body whitespace-pre-wrap">
          {game.description || 'No description available.'}
        </p>
      </Tabs.Content>

      <Tabs.Content value="reviews">
        <GameReviewList gameId={game.game.id} />
      </Tabs.Content>

      <Tabs.Content value="details">
        <div className="space-y-6">
          {game.genres && game.genres.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {game.genres.map((genre) => (
                  <a
                    key={genre.id}
                    href={`/games?genreIds=${genre.id}`}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
                  >
                    {genre.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {game.platforms && game.platforms.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {game.platforms.map((platform) => (
                  <a
                    key={platform.id}
                    href={`/games?platformIds=${platform.id}`}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground"
                  >
                    {platform.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {game.game.releaseDate && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Release date</h3>
              <p className="font-mono text-lg text-foreground-secondary">
                {new Date(game.game.releaseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}

function GameTabsSkeleton() {
  return (
    <div className="mb-12 animate-pulse">
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
        <div className="h-9 w-20 rounded-md bg-muted" />
        <div className="h-9 w-24 rounded-md bg-muted" />
        <div className="h-9 w-20 rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-full rounded-md bg-muted" />
        <div className="h-8 w-11/12 rounded-md bg-muted" />
        <div className="h-8 w-3/4 rounded-md bg-muted" />
      </div>
    </div>
  );
}
