import { useCurrentUserProfile } from '@/hooks/useUsers';
import type { UserProfile } from '@glitch/shared-types';
import { useState, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

// ============================================================================
// Props Interface
// ============================================================================

interface EditProfileDialogProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// EditProfileDialog Component
// ============================================================================

/**
 * Modal dialog for editing user profile
 *
 * @example
 * ```tsx
 * <EditProfileDialog
 *   profile={currentProfile}
 *   isOpen={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 * />
 * ```
 */
export default function EditProfileDialog({ profile, isOpen, onClose }: EditProfileDialogProps) {
  const { updateProfile, updateLoading, updateError, clearUpdateError } = useCurrentUserProfile();

  // Form state
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate || false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when profile changes
  useEffect(() => {
    setDisplayName(profile.displayName || '');
    setBio(profile.bio || '');
    setLocation(profile.location || '');
    setWebsite(profile.website || '');
    setIsPrivate(profile.isPrivate || false);
  }, [profile]);

  // Clear messages when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSuccessMessage(null);
      clearUpdateError();
    }
  }, [isOpen, clearUpdateError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        isPrivate,
      });

      setSuccessMessage('Profile updated.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            This is how other players see you across Glitch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tell us about yourself"
            />
            <p className="text-right font-mono text-xs text-muted-foreground">{bio.length}/500</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="City, Country"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="isPrivate">Private profile</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Only followers can see your activity
              </p>
            </div>
            <Switch.Root
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-strong bg-secondary transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            >
              <Switch.Thumb className="block size-4 translate-x-1 rounded-full bg-foreground-secondary transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary-foreground" />
            </Switch.Root>
          </div>

          {/* Messages */}
          {updateError && (
            <div className="rounded-md border border-error bg-error/10 p-3 text-sm text-error">
              {updateError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-success bg-success/10 p-3 text-sm text-success">
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="mt-0 gap-3 sm:justify-stretch">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={updateLoading} className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateLoading}
              className="flex-1"
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
