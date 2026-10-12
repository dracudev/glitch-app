import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $currentUser } from '@/stores/auth';
import { useRequireAuth } from '@/hooks/useAuth';
import { changePassword } from '@/services/auth';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
  const user = useStore($currentUser);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="shell py-16 text-center text-muted-foreground">
        {isAuthLoading ? 'Loading…' : 'Redirecting to log in…'}
      </div>
    );
  }

  return (
    <div className="shell py-8 lg:py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-2xl tracking-tight sm:text-3xl">Settings</h1>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-mono text-foreground">{user?.username}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="text-foreground">{user?.role}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Want to change your display name, bio, or avatar?{' '}
            <a
              href={`/profile/${user?.username}`}
              className="font-medium text-primary transition-colors hover:text-accent"
            >
              Edit your profile
            </a>
            .
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Change password</h2>
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, with upper and lower case, a number, and a symbol.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-error/20 bg-error/10 p-3 text-sm text-error"
              >
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-success/20 bg-success/10 p-3 text-sm text-success">
                {success}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
