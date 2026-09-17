import type { ActivityItem } from '@glitch/shared-types';
import * as Avatar from '@radix-ui/react-avatar';
import { ChevronRight } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import { getAvatarUrl } from '@/lib/avatar';

interface FeedItemProps {
  activity: ActivityItem;
}

export default function FeedItem({ activity }: FeedItemProps) {
  const { type, user, createdAt } = activity;

  // Normalize createdAt to a string for formatting helper
  const createdAtStr =
    typeof createdAt === 'string' ? createdAt : createdAt ? new Date(createdAt).toISOString() : '';

  // Format relative timestamp
  const formatTimestamp = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  // Render content based on activity type
  const renderActivityContent = () => {
    const activityType = String(type);

    switch (activityType) {
      case 'REVIEW_CREATED':
      case 'REVIEW_UPDATED': {
        const review = activity.review;
        if (!review?.game) return null;

        const snippet = review.content
          ? review.content.slice(0, 150) + (review.content.length > 150 ? '...' : '')
          : '';

        return (
          <div className="flex gap-4">
            {/* Game Cover */}
            {review.game?.coverImage && (
              <a href={`/games/${review.game?.slug}`} className="shrink-0">
                <img
                  src={review.game?.coverImage}
                  alt={review.game?.title}
                  className="h-28 w-20 rounded-md object-cover"
                />
              </a>
            )}

            {/* Review Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <a
                  href={`/games/${review.game?.slug}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {review.game?.title}
                </a>
              </div>

              {/* Rating */}
              {review.rating !== null && review.rating !== undefined && (
                <div className="mb-2">
                  <StarRating value={review.rating} size={16} />
                </div>
              )}

              {/* Review snippet */}
              {snippet && <p className="mb-2 text-base text-foreground-secondary">{snippet}</p>}

              {/* Read more link */}
              <a
                href={`/reviews/${review.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Read full review
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        );
      }

      case 'USER_FOLLOWED':
      case 'follow': {
        const followedUser = activity.followedUser;
        if (!followedUser) return null;

        return (
          <div className="flex items-center gap-4">
            {/* Followed User Avatar */}
            <a href={`/profile/${followedUser.username}`}>
              <Avatar.Root className="inline-flex size-12 items-center justify-center overflow-hidden rounded-full">
                <Avatar.Image
                  src={getAvatarUrl(followedUser)}
                  alt={followedUser.username}
                  className="size-full object-cover"
                />
                <Avatar.Fallback className="flex size-full items-center justify-center bg-muted text-lg font-semibold text-foreground">
                  {followedUser.username.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
            </a>

            {/* Followed User Info */}
            <div className="flex-1">
              <p className="text-base text-foreground-secondary">
                started following{' '}
                <a
                  href={`/profile/${followedUser.username}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {followedUser.displayName ?? followedUser.username}
                </a>
              </p>
            </div>
          </div>
        );
      }

      case 'review': {
        const review = activity.review;
        if (!review?.game) return null;

        const snippet = review.content
          ? review.content.slice(0, 150) + (review.content.length > 150 ? '...' : '')
          : '';

        return (
          <div className="flex gap-4">
            {/* Game Cover */}
            {review.game?.coverImage && (
              <a href={`/games/${review.game?.slug}`} className="shrink-0">
                <img
                  src={review.game?.coverImage}
                  alt={review.game?.title}
                  className="h-28 w-20 rounded-md object-cover"
                />
              </a>
            )}

            {/* Review Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-2">
                <a
                  href={`/games/${review.game?.slug}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {review.game?.title}
                </a>
              </div>

              {/* Rating */}
              {review.rating !== null && review.rating !== undefined && (
                <div className="mb-2">
                  <StarRating value={review.rating} size={16} />
                </div>
              )}

              {/* Review snippet */}
              {snippet && <p className="mb-2 text-base text-foreground-secondary">{snippet}</p>}

              {/* Read more link */}
              <a
                href={`/reviews/${review.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Read full review
                <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        );
      }

      // Placeholder for future activity types
      default:
        return <p className="text-base text-foreground-secondary">Activity type not yet implemented</p>;
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-6 interactive-surface hover:border-border-hover">
      {/* Activity Header */}
      <div className="mb-4 flex items-start gap-4">
        {/* User Avatar */}
        <a href={`/profile/${user.username}`} className="shrink-0">
          <Avatar.Root className="inline-flex size-10 items-center justify-center overflow-hidden rounded-full">
            <Avatar.Image
              src={getAvatarUrl(user)}
              alt={user.username}
              className="size-full object-cover"
            />
            <Avatar.Fallback className="flex size-full items-center justify-center bg-muted text-base font-semibold text-foreground">
              {user.username.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
        </a>

        {/* User Info & Timestamp */}
        <div className="min-w-0 flex-1">
          <a
            href={`/profile/${user.username}`}
            className="text-base font-semibold text-foreground hover:underline"
          >
            {user.displayName || user.username}
          </a>
          <p className="font-mono text-sm text-muted-foreground">{formatTimestamp(createdAtStr)}</p>
        </div>
      </div>

      {/* Activity Content */}
      {renderActivityContent()}
    </article>
  );
}
