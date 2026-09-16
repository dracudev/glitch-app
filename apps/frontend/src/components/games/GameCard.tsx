import { Star, Calendar } from 'lucide-react';
import type { GameResponse } from '@glitch/shared-types';

interface GameCardProps {
  game: GameResponse;
}

const badgeStyles =
  'absolute flex items-center gap-1 rounded-md border border-border bg-background/85 px-1.5 py-0.5 font-mono text-xs backdrop-blur-sm';

export default function GameCard({ game }: GameCardProps) {
  const basic = game.game;
  const releaseYear = basic.releaseDate ? new Date(basic.releaseDate).getFullYear() : null;

  return (
    <a
      href={`/games/${basic.slug}`}
      className="group block"
      aria-label={`View details for ${basic.title}`}
    >
      {/* Game Cover */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted transition-colors group-hover:border-border-hover">
        {/* Always render an img; if there's no coverImage use the local placeholder. Add onError to guard against broken remote URLs. */}
        <img
          src={basic.coverImage || '/images/game-placeholder.svg'}
          alt={basic.coverImage ? `${basic.title} cover` : `${basic.title} placeholder cover`}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            try {
              (e.currentTarget as HTMLImageElement).src = '/images/game-placeholder.svg';
            } catch (_) {
              /* swallow errors silently */
            }
          }}
        />

        {/* Average Rating Badge */}
        {basic.averageRating !== undefined && basic.averageRating !== null && (
          <div
            className={`${badgeStyles} right-2 top-2 font-medium text-foreground`}
            aria-label={`Average rating: ${basic.averageRating.toFixed(1)} out of 10`}
          >
            <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
            <span>{basic.averageRating.toFixed(1)}</span>
          </div>
        )}

        {/* Review Count Badge */}
        {basic.reviewCount > 0 && (
          <div className={`${badgeStyles} bottom-2 left-2 text-foreground-secondary`}>
            {basic.reviewCount} {basic.reviewCount === 1 ? 'review' : 'reviews'}
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {basic.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {releaseYear && (
            <div className="flex items-center gap-1">
              <Calendar className="size-3" aria-hidden="true" />
              <span className="font-mono">{releaseYear}</span>
            </div>
          )}

          {game.developer && (
            <>
              <span aria-hidden="true">•</span>
              <span className="line-clamp-1">{game.developer.name}</span>
            </>
          )}
        </div>

        {/* Genres */}
        {game.genres && game.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {game.genres.slice(0, 3).map((genre) => (
              <span
                key={genre.id}
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {genre.name}
              </span>
            ))}
            {game.genres.length > 3 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                +{game.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
