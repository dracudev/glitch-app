import { useEffect, useState, type FormEvent } from 'react';
import type { AdminCreateUserInput, AdminUpdateUserInput, AdminUser, UserRole } from '@glitch/shared-types';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { createAdminUser, updateAdminUser } from '@/services/admin';
import { notify } from '@/stores/notifications';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'USER', label: 'User' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' },
];

interface FormState {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  isPrivate: boolean;
}

const emptyForm: FormState = {
  email: '',
  username: '',
  displayName: '',
  password: '',
  role: 'USER',
  isPrivate: false,
};

function formFromUser(user: AdminUser): FormState {
  return {
    email: user.email,
    username: user.username,
    displayName: user.displayName ?? '',
    password: '',
    role: user.role,
    isPrivate: user.isPrivate,
  };
}

interface AdminUserDialogProps {
  /** `null` creates, a user edits, `undefined` is closed. */
  target: AdminUser | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Create/edit form for a single user.
 *
 * `role` here is the only thing that grants panel access, so it is rendered as
 * plain radio-free options rather than anything playful.
 */
export default function AdminUserDialog({ target, onClose, onSaved }: AdminUserDialogProps) {
  const isOpen = target !== undefined;
  const editing = target ?? null;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens on a different target.
  useEffect(() => {
    setForm(editing ? formFromUser(editing) : emptyForm);
    setError(null);
  }, [editing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editing) {
        const payload: AdminUpdateUserInput = {
          email: form.email,
          username: form.username,
          displayName: form.displayName || undefined,
          role: form.role,
          isPrivate: form.isPrivate,
        };
        if (form.password) payload.password = form.password;

        await updateAdminUser(editing.id, payload);
        notify({ title: `Updated ${form.username}`, tone: 'success' });
      } else {
        const payload: AdminCreateUserInput = {
          email: form.email,
          username: form.username,
          password: form.password,
          displayName: form.displayName || undefined,
          role: form.role,
        };

        await createAdminUser(payload);
        notify({ title: `Created ${form.username}`, tone: 'success' });
      }

      onSaved();
      onClose();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Something went wrong';
      setError(message);
      notify({ title: message, tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit user' : 'Create user'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Leave the password empty to keep the current one.'
              : 'The password is hashed on the server before it is stored.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-user-email">Email</Label>
            <Input
              id="admin-user-email"
              type="email"
              required
              autoComplete="off"
              className="mt-1.5"
              value={form.email}
              onChange={(event) => set('email', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-user-username">Username</Label>
              <Input
                id="admin-user-username"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                autoComplete="off"
                className="mt-1.5"
                value={form.username}
                onChange={(event) => set('username', event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="admin-user-display-name">Display name</Label>
              <Input
                id="admin-user-display-name"
                maxLength={100}
                autoComplete="off"
                className="mt-1.5"
                value={form.displayName}
                onChange={(event) => set('displayName', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-user-password">
                Password{editing ? ' (optional)' : ''}
              </Label>
              <Input
                id="admin-user-password"
                type="password"
                required={!editing}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                className="mt-1.5"
                value={form.password}
                onChange={(event) => set('password', event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="admin-user-role">Role</Label>
              <div className="mt-1.5">
                <Select
                  id="admin-user-role"
                  ariaLabel="Role"
                  fullWidth
                  value={form.role}
                  onValueChange={(next) => set('role', next as UserRole)}
                  options={ROLE_OPTIONS}
                />
              </div>
            </div>
          </div>

          {editing && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.isPrivate}
                onChange={(event) => set('isPrivate', event.target.checked)}
              />
              Private profile
            </label>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
