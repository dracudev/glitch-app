import { Heart, MessageSquare } from 'lucide-react';
import type { ReviewResponse } from '@glitch/shared-types';
import StarRating from '@/components/ui/StarRating';
import { getAvatarUrl } from '@/lib/avatar';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewCardProps {
  review: ReviewResponse;
}

// ============================================================================
// ReviewCard Component
// ============================================================================

/**
 * Individual review card component
 *
 * Displays a review with game cover, user info, rating, and content preview.
 * All elements are clickable links to their respective pages.
 *
 * @example
 * ```tsx
 * <ReviewCard review={reviewData} />
 * ```
 */
export default function ReviewCard({ review }: ReviewCardProps) {
  // ============================================================================
  // Helpers
  // ============================================================================

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Generate avatar URL (using the shared DiceBear fallback)
  const avatarUrl = getAvatarUrl(review.user);

  // Generate game cover URL
  const coverUrl = review.game.coverImage || '/images/game-placeholder.svg';

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card interactive-surface hover:border-border-hover md:flex-row">
      {/* Review link stretches over the entire card */}
      <a
        href={`/reviews/${review.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Read review of ${review.game.title} by ${review.user.displayName}`}
      />

      {/* Game Cover Image */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted md:aspect-[3/4] md:w-36">
        <img
          src={coverUrl}
          alt={review.game.title}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            try {
              (e.currentTarget as HTMLImageElement).src = '/images/game-placeholder.svg';
            } catch (_) {
              /* noop */
            }
          }}
        />
        {/* Spoiler Badge */}
        {review.isSpoiler && (
          <div className="absolute right-2 top-2 z-20 rounded-full border border-border bg-background/85 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
            SPOILER
          </div>
        )}
      </div>

      {/* Card Content — `min-w-0` keeps the rating row from setting a min-content
          floor that would push this column past the card's clipped edge. */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        {/* Game Title */}
        <h3 className="line-clamp-2 text-base font-semibold text-foreground">
          {review.game.title}
        </h3>

        {/* User Info — separate link above the card overlay */}
        <div className="mt-3">
          <a
            href={`/profile/${review.user.username}`}
            className="relative z-20 inline-flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src={avatarUrl}
              alt={review.user.displayName}
              className="size-8 rounded-full border border-border"
              loading="lazy"
              decoding="async"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {review.user.displayName}
              </span>
              <span className="text-xs text-muted-foreground">@{review.user.username}</span>
            </div>
          </a>
        </div>

        {/* Rating Stars */}
        <div className="mb-3 mt-3 flex items-center gap-2">
          <StarRating value={review.rating} size={16} />
          <span className="font-mono text-sm font-semibold text-accent">
            {review.rating.toFixed(1)}
          </span>
        </div>

        {/* Review Title (if exists) */}
        {review.title && (
          <h4 className="mb-2 line-clamp-1 text-sm font-medium text-foreground">{review.title}</h4>
        )}

        {/* Content Preview */}
        <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
          {truncateContent(review.content)}
        </p>

        {/* Footer: stats and date, pinned to the bottom so grids stay aligned */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {/* Likes */}
            <div className="flex items-center gap-1">
              <Heart className="size-4 fill-current" aria-hidden="true" />
              <span className="font-mono">{review.stats.likesCount}</span>
            </div>

            {/* Comments */}
            <div className="flex items-center gap-1">
              <MessageSquare className="size-4 fill-current" aria-hidden="true" />
              <span className="font-mono">{review.stats.commentsCount}</span>
            </div>
          </div>

          {/* Date */}
          <time className="font-mono" dateTime={new Date(review.createdAt).toISOString()}>
            {formatDate(review.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}
