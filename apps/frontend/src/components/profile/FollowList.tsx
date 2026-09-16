import { useStore } from '@nanostores/react';
import * as Avatar from '@radix-ui/react-avatar';
import { $viewedFollowers, $viewedFollowing } from '@/stores/users';
import type { UserResponse } from '@glitch/shared-types';
import { getAvatarUrl } from '@/lib/avatar';

// ============================================================================
// Props Interface
// ============================================================================

interface FollowListProps {
  type: 'followers' | 'following';
  username: string;
}

// ============================================================================
// FollowList Component
// ============================================================================

/**
 * Reusable component for displaying followers or following lists
 *
 * @example
 * ```tsx
 * <FollowList type="followers" username="john_doe" />
 * <FollowList type="following" username="jane_smith" />
 * ```
 */
export default function FollowList({ type, username }: FollowListProps) {
  const followers = useStore($viewedFollowers);
  const following = useStore($viewedFollowing);

  // Select the appropriate data based on type
  const data = type === 'followers' ? followers : following;
  const users = data?.items || [];

  // Loading state
  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <UserSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          No {type === 'followers' ? 'followers' : 'following'} yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {type === 'followers'
            ? `${username} doesn't have any followers yet`
            : `${username} isn't following anyone yet`}
        </p>
      </div>
    );
  }

  // User list
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Pagination info */}
      {data.meta && data.meta.totalPages > 1 && (
        <div className="pt-4 text-center text-sm text-muted-foreground">
          Page <span className="font-mono">{data.meta.page}</span> of{' '}
          <span className="font-mono">{data.meta.totalPages}</span>
        </div>
      )}
    </>
  );
}

// ============================================================================
// UserCard Component
// ============================================================================

interface UserCardProps {
  user: UserResponse;
}

function UserCard({ user }: UserCardProps) {
  // Generate avatar URL with fallback
  const avatarUrl = getAvatarUrl(user, 64);

  return (
    <a
      href={`/profile/${user.username}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 interactive-surface hover:border-border-hover"
    >
      {/* Avatar with Radix UI */}
      <Avatar.Root className="inline-flex size-12 select-none items-center justify-center overflow-hidden rounded-full align-middle">
        <Avatar.Image
          className="size-full object-cover"
          src={avatarUrl}
          alt={user.username}
          loading="lazy"
          decoding="async"
        />
        <Avatar.Fallback
          className="flex size-full items-center justify-center bg-muted text-sm font-semibold text-foreground"
          delayMs={600}
        >
          {user.username.slice(0, 2).toUpperCase()}
        </Avatar.Fallback>
      </Avatar.Root>

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-foreground">
          {user.displayName || user.username}
        </h3>
        <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
      </div>

      {/* Arrow icon */}
      <svg
        className="size-5 shrink-0 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

// ============================================================================
// UserSkeleton Component
// ============================================================================

function UserSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg border border-border bg-card p-4">
      {/* Avatar skeleton */}
      <div className="size-12 rounded-full bg-muted" />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-5 w-32 rounded-md bg-muted" />
        <div className="h-4 w-24 rounded-md bg-muted" />
      </div>

      {/* Arrow skeleton */}
      <div className="size-5 rounded-md bg-muted" />
    </div>
  );
}
