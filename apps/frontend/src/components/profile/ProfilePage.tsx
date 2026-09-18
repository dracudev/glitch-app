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

interface ProfilePageProps {
  profile: UserProfile;
  username: string;
}

export default function ProfilePage({ profile, username }: ProfilePageProps) {
  useEffect(() => {
    setViewedProfile(profile);

    Promise.all([
      loadUserFollowers(username),
      loadUserFollowing(username),
      loadUserReviews(profile.id, { page: 1, limit: 10 }),
    ]);

    return () => {
      clearViewedProfileState();
    };
  }, [profile, username]);

  return (
    <div className="shell py-8 lg:py-10">
      <ProfileHeader profile={profile} />

      <div className="mt-6">
        <ProfileTabs profile={profile} />
      </div>
    </div>
  );
}
