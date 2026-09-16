import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Calendar, Users, Building2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { GameDetail } from '@glitch/shared-types';
import { useGameDetail } from '@/hooks/useGames';
import { $currentUser } from '@/stores/auth';
import ReviewFormDialog from './ReviewFormDialog';
import { Button } from '@/components/ui/Button';
import { notify } from '@/stores/notifications';

interface GameHeaderProps {
  /** Server-rendered game. Used for the first paint so the SSR HTML carries
   * real content; the store is still the source of truth after mount. */
  game?: GameDetail;
}

export default function GameHeader({ game: initialGame }: GameHeaderProps) {
  const { game: storeGame } = useGameDetail();
  const game = initialGame ?? storeGame;
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Only a genuinely empty store (e.g. client-side navigation) hits this branch.
  if (!game) {
    return <GameHeaderSkeleton />;
  }

  const releaseDate = game.game.releaseDate
    ? new Date(game.game.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBA';

  // Fallback placeholder for missing cover images
  const coverSrc = game.game.coverImage || '/images/game-placeholder.svg';

  return (
    <header className="mb-8">
      {/* Mobile Layout: Vertical */}
      <div className="flex flex-col gap-6 lg:hidden">
        {/* Cover Image — above the fold, so decode eagerly but don't defer. */}
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={coverSrc}
            alt={game.game.title}
            className="size-full object-cover"
            decoding="async"
          />
        </div>

        {/* Title and Meta */}
        <div>
          <h1 className="mb-2 text-2xl tracking-tight sm:text-3xl">{game.game.title}</h1>

          {game.developer && (
            <a
              href={`/developers/${game.developer.slug}`}
              className="mb-1 flex items-center gap-2 text-primary hover:underline"
            >
              <Users className="size-4" aria-hidden="true" />
              {game.developer.name}
            </a>
          )}

          {game.publisher && (
            <a
              href={`/publishers/${game.publisher.slug}`}
              className="flex items-center gap-2 text-foreground-secondary transition-colors hover:text-primary"
            >
              <Building2 className="size-4" aria-hidden="true" />
              {game.publisher.name}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <ActionButtons onWriteReview={() => setIsReviewDialogOpen(true)} />
      </div>

      {/* Desktop Layout: Horizontal */}
      <div className="hidden gap-8 lg:flex">
        {/* Cover Image (show placeholder if missing) */}
        <div className="aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={coverSrc}
            alt={game.game.title}
            className="size-full object-cover"
            decoding="async"
          />
        </div>

        {/* Info and Actions */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h1 className="mb-4 text-2xl tracking-tight sm:text-3xl">{game.game.title}</h1>

            <div className="mb-6 space-y-2 text-foreground-secondary">
              {game.developer && (
                <a
                  href={`/developers/${game.developer.slug}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Users className="size-5" aria-hidden="true" />
                  <span className="text-lg">{game.developer.name}</span>
                </a>
              )}

              {game.publisher && (
                <a
                  href={`/publishers/${game.publisher.slug}`}
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Building2 className="size-5" aria-hidden="true" />
                  <span className="text-lg">{game.publisher.name}</span>
                </a>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="size-5" aria-hidden="true" />
                <span className="font-mono text-lg">{releaseDate}</span>
              </div>
            </div>

            {/* Platforms */}
            {game.platforms && game.platforms.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
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
            )}
          </div>

          <ActionButtons onWriteReview={() => setIsReviewDialogOpen(true)} />
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewFormDialog
        gameId={game.game.id}
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
      />
    </header>
  );
}

function ActionButtons({ onWriteReview }: { onWriteReview: () => void }) {
  const user = useStore($currentUser);

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onWriteReview} className="flex-1 lg:flex-initial">
        Write a review
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="secondary"
            className="flex-1 lg:flex-initial"
            onClick={() => {
              if (!user) {
                notify({
                  title: 'Sign in to save games to a list',
                  action: { label: 'Sign in', href: '/auth/login' },
                });
              }
            }}
          >
            Add to list
          </Button>
        </DropdownMenu.Trigger>

        {user ? (
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-popover min-w-56 rounded-lg border border-border bg-popover p-1 shadow-lg"
              sideOffset={5}
            >
              <DropdownMenu.Item className="relative flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground">
                Favorites
              </DropdownMenu.Item>
              <DropdownMenu.Item className="relative flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground">
                Playing
              </DropdownMenu.Item>
              <DropdownMenu.Item className="relative flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground">
                Completed
              </DropdownMenu.Item>
              <DropdownMenu.Item className="relative flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-foreground-secondary outline-none transition-colors data-[highlighted]:bg-secondary data-[highlighted]:text-foreground">
                Want to play
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        ) : null}
      </DropdownMenu.Root>
    </div>
  );
}

function GameHeaderSkeleton() {
  return (
    <header className="mb-8 animate-pulse">
      {/* Mobile: vertical — mirrors the real header's mobile layout. */}
      <div className="flex flex-col gap-6 lg:hidden">
        <div className="aspect-video w-full rounded-lg border border-border bg-card" />
        <div className="space-y-2">
          <div className="h-8 w-3/4 rounded-md bg-muted" />
          <div className="h-5 w-1/2 rounded-md bg-muted" />
          <div className="h-5 w-1/3 rounded-md bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 flex-1 rounded-md bg-muted" />
          <div className="h-10 flex-1 rounded-md bg-muted" />
        </div>
      </div>

      {/* Desktop: horizontal — same cover ratio, meta lines and button row. */}
      <div className="hidden gap-8 lg:flex">
        <div className="aspect-[3/4] w-64 shrink-0 rounded-lg border border-border bg-card" />
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="mb-4 h-8 w-2/3 rounded-md bg-muted" />
            <div className="mb-6 space-y-2">
              <div className="h-6 w-1/3 rounded-md bg-muted" />
              <div className="h-6 w-1/4 rounded-md bg-muted" />
              <div className="h-6 w-1/3 rounded-md bg-muted" />
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 rounded-md bg-muted" />
            <div className="h-10 w-32 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </header>
  );
}
