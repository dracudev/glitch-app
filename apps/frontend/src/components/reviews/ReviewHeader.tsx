import type { ReviewResponse } from '@glitch/shared-types';

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

  // Generate avatar URL (using DiceBear as fallback)
  const avatarUrl =
    review.user.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(review.user.username)}`;

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
        <svg
          key={`full-${i}`}
          className="w-5 h-5 md:w-6 md:h-6 text-accent"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      );
    }

    // Half star
    if (hasHalfStar && fullStars < 10) {
      stars.push(
        <svg
          key="half"
          className="w-5 h-5 md:w-6 md:h-6 text-accent"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="currentColor" />
              {/* Must match the empty stars' `text-muted-foreground`, or the unfilled
                  half reads as a different grey from a whole empty star. */}
              <stop offset="50%" stopColor="var(--text-muted)" />
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
        <svg
          key={`empty-${i}`}
          className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      );
    }

    return stars;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <header className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Mobile-First Layout: Stacked on mobile, Grid on larger screens */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 p-4 md:p-6">
        {/* Game Cover Image */}
        <a
          href={`/games/${review.game.slug}`}
          className="shrink-0 self-start group"
          aria-label={`View ${review.game.title}`}
        >
          <div className="relative w-32 md:w-40 lg:w-48 aspect-[3/4] rounded-md overflow-hidden bg-muted border border-border">
            <img
              src={coverUrl}
              alt={review.game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Spoiler Badge */}
            {review.isSpoiler && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-semibold shadow-md">
                SPOILER
              </div>
            )}
          </div>
        </a>

        {/* Review Metadata */}
        <div className="flex-1 min-w-0">
          {/* Game Title */}
          <a
            href={`/games/${review.game.slug}`}
            className="block group mb-4"
            aria-label={`View ${review.game.title}`}
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground group-hover:text-accent transition-colors">
              {review.game.title}
            </h1>
          </a>

          {/* User Information */}
          <a
            href={`/profile/${review.user.username}`}
            className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity group"
            aria-label={`View ${review.user.displayName}'s profile`}
          >
            <img
              src={avatarUrl}
              alt={review.user.displayName}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border group-hover:border-primary transition-colors"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base md:text-lg font-semibold text-foreground truncate">
                {review.user.displayName}
              </span>
              <span className="text-sm text-muted-foreground">@{review.user.username}</span>
            </div>
          </a>

          {/* Star Rating */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={`Rating: ${review.rating} out of 10`}
            >
              {renderStars()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xl md:text-2xl font-bold text-accent">
                {review.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">10</span>
            </div>
          </div>

          {/* Publication Date */}
          <div className="mt-4 text-sm text-muted-foreground">
            <time dateTime={new Date(review.createdAt).toISOString()}>
              {formatDate(review.createdAt)}
            </time>
            {review.updatedAt !== review.createdAt && (
              <span className="ml-2 text-xs">(Updated {formatDate(review.updatedAt)})</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
