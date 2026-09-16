import { useFollowActions } from '@/hooks/useSocial';
import { useEffect, useState } from 'react';
import { setFollowingStatus } from '@/stores/social';
import { $currentUser } from '@/stores/auth';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/Button';
import { notify } from '@/stores/notifications';

// ============================================================================
// Props Interface
// ============================================================================

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
}

// ============================================================================
// FollowButton Component
// ============================================================================

/**
 * Follow/Unfollow button with optimistic updates
 *
 * @example
 * ```tsx
 * <FollowButton userId="user-123" initialIsFollowing={false} />
 * ```
 */
export default function FollowButton({ userId, initialIsFollowing = false }: FollowButtonProps) {
  const { followUser, unfollowUser, followingStatus, loadingActions } =
    useFollowActions();
  const currentUser = useStore($currentUser);
  const [error, setError] = useState<string | null>(null);

  // Seed the store with the SSR initial value on mount
  useEffect(() => {
    setFollowingStatus(userId, initialIsFollowing);
  }, [userId, initialIsFollowing]);

  // Determine current following status
  const isFollowing = followingStatus[userId] ?? initialIsFollowing;
  const isLoading = loadingActions[userId] ?? false;

  const handleToggle = async () => {
    if (!currentUser) {
      notify({
        title: 'Sign in to follow people',
        action: { label: 'Sign in', href: '/auth/login' },
      });
      return;
    }
    setError(null);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant={isFollowing ? 'outline' : 'primary'}
        isLoading={isLoading}
        fullWidth
        className={
          isFollowing ? 'hover:border-error hover:text-error' : ''
        }
        aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
        aria-pressed={isFollowing}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      {error && <span className="text-center text-sm text-error">{error}</span>}
    </div>
  );
}
