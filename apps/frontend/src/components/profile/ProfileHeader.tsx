import { useStore } from '@nanostores/react';
import * as Avatar from '@radix-ui/react-avatar';
import { Calendar, Link, Lock, MapPin } from 'lucide-react';
import type { UserProfile } from '@glitch/shared-types';
import { $currentUser } from '@/stores/auth';
import { $viewedProfile } from '@/stores/users';
import FollowButton from './FollowButton';
import { useEffect, useState } from 'react';
import EditProfileDialog from './EditProfileDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getAvatarUrl } from '@/lib/avatar';

// Props Interface
interface ProfileHeaderProps {
  profile: UserProfile;
}

// ProfileHeader Component
export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const currentUser = useStore($currentUser);
  const viewedProfile = useStore($viewedProfile);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // `$currentUser` is client-only (localStorage); gating until after mount avoids a hydration mismatch.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const displayProfile = viewedProfile || profile;

  const isOwnProfile = isClient && currentUser?.id === displayProfile.id;

  const avatarUrl = getAvatarUrl(displayProfile, 128);

  return (
    <>
      <Card className="p-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <Avatar.Root className="inline-flex size-24 select-none items-center justify-center overflow-hidden rounded-full border border-border align-middle lg:size-32">
                <Avatar.Image
                  className="size-full object-cover"
                  src={avatarUrl}
                  alt={displayProfile.username}
                  decoding="async"
                />
                <Avatar.Fallback
                  className="flex size-full items-center justify-center bg-muted text-2xl font-semibold text-foreground lg:text-3xl"
                  delayMs={600}
                >
                  {displayProfile.username.slice(0, 2).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              {displayProfile.isPrivate && (
                <div
                  className="absolute bottom-0 right-0 rounded-full border border-border bg-card p-2"
                  title="Private profile"
                >
                    <Lock className="size-5 text-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center lg:col-span-1 lg:mt-0 lg:text-left">
            <h1 className="text-2xl tracking-tight sm:text-3xl">
              {displayProfile.displayName || displayProfile.username}
            </h1>
            <p className="text-base text-muted-foreground lg:text-lg">@{displayProfile.username}</p>

            {displayProfile.bio && (
              <p className="mt-4 whitespace-pre-wrap text-foreground">{displayProfile.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground lg:justify-start">
              {displayProfile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {displayProfile.location}
                </span>
              )}
              {displayProfile.website && (
                <a
                  href={displayProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-accent"
                >
                  <Link className="size-4" />
                  {new URL(displayProfile.website).hostname}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                Joined{' '}
                <span className="font-mono">
                  {new Date(displayProfile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </span>
            </div>

            <div className="mt-6 flex justify-center gap-8 lg:justify-start">
              <div className="text-center lg:text-left">
                <div className="font-mono text-2xl font-semibold text-foreground">
                  {displayProfile.stats.reviewsCount}
                </div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="font-mono text-2xl font-semibold text-foreground">
                  {displayProfile.stats.followersCount}
                </div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="font-mono text-2xl font-semibold text-foreground">
                  {displayProfile.stats.followingCount}
                </div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-stretch lg:mt-0 lg:items-end lg:justify-start">
            {isOwnProfile ? (
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                variant="primary"
                className="w-full lg:w-auto"
              >
                Edit profile
              </Button>
            ) : (
              <div className="w-full lg:w-auto">
                <FollowButton
                  userId={displayProfile.id}
                  initialIsFollowing={displayProfile.isFollowing}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {isOwnProfile && (
        <EditProfileDialog
          profile={displayProfile}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </>
  );
}
