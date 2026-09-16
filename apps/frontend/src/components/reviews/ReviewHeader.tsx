import { Star } from 'lucide-react';
import type { ReviewResponse } from '@glitch/shared-types';
import { getAvatarUrl } from '@/lib/avatar';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewHeaderProps {
  review: ReviewResponse;
}

// ============================================================================
// ReviewHeader Component
// ============================================================================

/**
 * Review header component displaying the review masthead
 *
 * Shows game cover, game title, user avatar, username, and star rating.
 * All elements are linked to their respective pages.
 *
 * @example
 * ```tsx
 * <ReviewHeader review={reviewData} />
 * ```
 */
export default function ReviewHeader({ review }: ReviewHeaderProps) {
  // ============================================================================
  // Helpers
  // ============================================================================

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate avatar URL (using the shared DiceBear fallback)
  const avatarUrl = getAvatarUrl(review.user);

  // Generate game cover URL
  const coverUrl = review.game.coverImage || '/images/game-placeholder.svg';

  // ============================================================================
  // Render Star Rating
  // ============================================================================

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(review.rating);
    const hasHalfStar = review.rating % 1 >= 0.5;

    // Full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="size-5 fill-current text-accent md:size-6"
          aria-hidden="true"
        />,
      );
    }

    // Half star
    if (hasHalfStar && fullStars < 10) {
      stars.push(
        <svg
          key="half"
          className="size-5 text-accent md:size-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="currentColor" />
              {/* Must match the empty stars' `text-muted-foreground`, or the unfilled
                  half reads as a different grey from a whole empty star. */}
              <stop offset="50%" stopColor="var(--color-muted-foreground)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfGradient)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>,
      );
    }

    // Empty stars
    const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className="size-5 fill-current text-muted-foreground md:size-6"
          aria-hidden="true"
        />,
      );
    }

    return stars;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <header className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Mobile-First Layout: Stacked on mobile, Grid on larger screens */}
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:gap-6 md:p-6">
        {/* Game Cover Image — above the fold, so decode eagerly but don't defer. */}
        <a
          href={`/games/${review.game.slug}`}
          className="shrink-0 self-start"
          aria-label={`View ${review.game.title}`}
        >
          <div className="relative aspect-[3/4] w-32 overflow-hidden rounded-md border border-border bg-muted md:w-40 lg:w-48">
            <img
              src={coverUrl}
              alt={review.game.title}
              className="size-full object-cover"
              decoding="async"
            />
            {/* Spoiler Badge */}
            {review.isSpoiler && (
              <div className="absolute right-2 top-2 rounded-full border border-border bg-background/85 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
                SPOILER
              </div>
            )}
          </div>
        </a>

        {/* Review Metadata */}
        <div className="min-w-0 flex-1">
          {/* Game Title */}
          <a
            href={`/games/${review.game.slug}`}
            className="mb-4 block"
            aria-label={`View ${review.game.title}`}
          >
            <h1 className="text-2xl tracking-tight sm:text-3xl">{review.game.title}</h1>
          </a>

          {/* User Information */}
          <a
            href={`/profile/${review.user.username}`}
            className="mb-4 flex items-center gap-3 transition-opacity hover:opacity-80"
            aria-label={`View ${review.user.displayName}'s profile`}
          >
            <img
              src={avatarUrl}
              alt={review.user.displayName}
              className="size-10 rounded-full border border-border md:size-12"
              decoding="async"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold text-foreground md:text-lg">
                {review.user.displayName}
              </span>
              <span className="text-sm text-muted-foreground">@{review.user.username}</span>
            </div>
          </a>

          {/* Star Rating */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={`Rating: ${review.rating} out of 10`}
            >
              {renderStars()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono text-xl font-semibold text-accent md:text-2xl">
                {review.rating.toFixed(1)}
              </span>
              <span className="font-mono text-muted-foreground">/</span>
              <span className="font-mono text-muted-foreground">10</span>
            </div>
          </div>

          {/* Publication Date */}
          <div className="mt-4 text-sm text-muted-foreground">
            <time className="font-mono" dateTime={new Date(review.createdAt).toISOString()}>
              {formatDate(review.createdAt)}
            </time>
            {review.updatedAt !== review.createdAt && (
              <span className="ml-2 font-mono text-xs">
                (Updated {formatDate(review.updatedAt)})
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
