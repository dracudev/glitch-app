import { useEffect } from 'react';
import type { UserProfile } from '@glitch/shared-types';

// Components
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';

// Stores
import {
  setViewedProfile,
  loadUserFollowers,
  loadUserFollowing,
  clearViewedProfileState,
} from '@/stores/users';
import { loadUserReviews } from '@/stores/reviews';

// ============================================================================
// Props Interface
// ============================================================================

interface ProfilePageProps {
  profile: UserProfile;
  username: string;
}

// ============================================================================
// ProfilePage Component (Refactored)
// ============================================================================

/**
 * Profile page component using modular components
 *
 * Displays user profile information using ProfileHeader and ProfileTabs.
 * Initializes with server-side rendered data and handles client-side updates.
 *
 * @example
 * ```tsx
 * <ProfilePage profile={profileData} username="john_doe" client:load />
 * ```
 */
export default function ProfilePage({ profile, username }: ProfilePageProps) {
  // ============================================================================
  // Initialization Effect
  // ============================================================================

  useEffect(() => {
    // Initialize store with server-rendered data
    setViewedProfile(profile);

    // Fetch additional data
    Promise.all([
      loadUserFollowers(username),
      loadUserFollowing(username),
      loadUserReviews(profile.id, { page: 1, limit: 10 }),
    ]);

    // Cleanup on unmount
    return () => {
      clearViewedProfileState();
    };
  }, [profile, username]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="shell py-8 lg:py-10">
      {/* Profile Header with avatar, bio, stats, and follow/edit button */}
      <ProfileHeader profile={profile} />

      {/* Profile Content with Tabs (Reviews, Followers, Following) */}
      <div className="mt-6">
        <ProfileTabs profile={profile} />
      </div>
    </div>
  );
}
