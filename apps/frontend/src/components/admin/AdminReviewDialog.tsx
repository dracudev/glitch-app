import { useEffect, useState, type FormEvent } from 'react';
import type { ReviewResponse, UpdateReviewRequest } from '@glitch/shared-types';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { updateAdminReview } from '@/services/admin';
import { notify } from '@/stores/notifications';

interface FormState {
  title: string;
  content: string;
  rating: string;
  isSpoiler: boolean;
  isPublished: boolean;
}

interface AdminReviewDialogProps {
  /** The review being moderated, or `null` when closed. */
  target: ReviewResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Moderation form for a single review.
 *
 * Editing runs through the public `PATCH /reviews/:id`, which the backend
 * allows an admin to call on someone else's review.
 */
export default function AdminReviewDialog({ target, onClose, onSaved }: AdminReviewDialogProps) {
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      setForm(null);
      return;
    }
    setForm({
      title: target.title ?? '',
      content: target.content,
      rating: String(target.rating),
      isSpoiler: target.isSpoiler,
      isPublished: target.isPublished,
    });
    setError(null);
  }, [target]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target || !form) return;

    const rating = Number(form.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      setError('Rating must be between 0 and 10');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: UpdateReviewRequest = {
      title: form.title || undefined,
      content: form.content,
      rating,
      isSpoiler: form.isSpoiler,
      isPublished: form.isPublished,
    };

    try {
      await updateAdminReview(target.id, payload);
      notify({ title: 'Review updated', tone: 'success' });
      onSaved();
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Something went wrong';
      setError(message);
      notify({ title: message, tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
          <DialogDescription>
            {target
              ? `${target.user.username} on ${target.game.title}`
              : 'Moderate a review'}
          </DialogDescription>
        </DialogHeader>

        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-review-title">Title</Label>
              <Input
                id="admin-review-title"
                maxLength={200}
                className="mt-1.5"
                value={form.title}
                onChange={(event) => set('title', event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="admin-review-content">Content</Label>
              <Textarea
                id="admin-review-content"
                required
                rows={8}
                className="mt-1.5"
                value={form.content}
                onChange={(event) => set('content', event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="admin-review-rating">Rating (0-10)</Label>
                <Input
                  id="admin-review-rating"
                  type="number"
                  required
                  min={0}
                  max={10}
                  step={0.5}
                  className="mt-1.5 font-mono"
                  value={form.rating}
                  onChange={(event) => set('rating', event.target.value)}
                />
              </div>

              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.isPublished}
                    onChange={(event) => set('isPublished', event.target.checked)}
                  />
                  Published
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.isSpoiler}
                    onChange={(event) => set('isSpoiler', event.target.checked)}
                  />
                  Contains spoilers
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
