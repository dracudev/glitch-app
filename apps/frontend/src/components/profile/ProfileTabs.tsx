import * as Tabs from '@radix-ui/react-tabs';
import { useStore } from '@nanostores/react';
import type { UserProfile } from '@glitch/shared-types';
import { $viewedProfile } from '@/stores/users';
import ReviewList from './ReviewList';
import FollowList from './FollowList';

// ============================================================================
// Props Interface
// ============================================================================

interface ProfileTabsProps {
  profile: UserProfile;
}

// ============================================================================
// ProfileTabs Component
// ============================================================================

/**
 * Tabbed navigation for profile sections (Reviews, Followers, Following)
 *
 * @example
 * ```tsx
 * <ProfileTabs profile={userProfile} />
 * ```
 */
export default function ProfileTabs({ profile }: ProfileTabsProps) {
  const viewedProfile = useStore($viewedProfile);
  const displayProfile = viewedProfile || profile;
  return (
    <Tabs.Root defaultValue="reviews" className="w-full">
      {/* Tab List */}
      <Tabs.List
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border no-scrollbar"
        aria-label="Profile sections"
      >
        <Tabs.Trigger
          value="reviews"
          className="cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground"
        >
          Reviews
          <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
            {displayProfile.stats.reviewsCount}
          </span>
        </Tabs.Trigger>

        <Tabs.Trigger
          value="followers"
          className="cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground"
        >
          Followers
          <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
            {displayProfile.stats.followersCount}
          </span>
        </Tabs.Trigger>

        <Tabs.Trigger
          value="following"
          className="cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground"
        >
          Following
          <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
            {displayProfile.stats.followingCount}
          </span>
        </Tabs.Trigger>
      </Tabs.List>

      {/* Tab Content */}
      <Tabs.Content value="reviews">
        <ReviewList userId={displayProfile.id} />
      </Tabs.Content>

      <Tabs.Content value="followers">
        <FollowList type="followers" username={displayProfile.username} />
      </Tabs.Content>

      <Tabs.Content value="following">
        <FollowList type="following" username={displayProfile.username} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
