import { useState, useEffect } from 'react';
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
import { useStore } from '@nanostores/react';
import { $currentUser } from '@/stores/auth';
import StarRating from '@/components/ui/StarRating';
import { useReviewActions } from '@/hooks/useReviews';
import { notify } from '@/stores/notifications';
import type { ReviewResponse } from '@glitch/shared-types';

// ============================================================================
// Props
// ============================================================================

interface ReviewFormDialogProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
  /** If provided, dialog operates in edit mode */
  existingReview?: ReviewResponse | null;
}

// ============================================================================
// ReviewFormDialog Component
// ============================================================================

export default function ReviewFormDialog({
  gameId,
  isOpen,
  onClose,
  existingReview,
}: ReviewFormDialogProps) {
  const isEditMode = Boolean(existingReview);
  const user = useStore($currentUser);
  const { createReview, updateReview, isLoading, error: actionError } = useReviewActions();

  const [title, setTitle] = useState(existingReview?.title || '');
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [content, setContent] = useState(existingReview?.content || '');
  const [isSpoiler, setIsSpoiler] = useState(existingReview?.isSpoiler || false);
  const [localError, setLocalError] = useState<string | null>(null);

  const error = localError || actionError;

  // Reset form when dialog opens for a new review
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset after close animation
      setTimeout(() => {
        if (!existingReview) {
          setTitle('');
          setRating(5);
          setContent('');
          setIsSpoiler(false);
        }
        setLocalError(null);
      }, 200);
      onClose();
    }
  };

  // Sync state when existingReview changes (edit mode)
  useEffect(() => {
    if (existingReview) {
      setTitle(existingReview.title || '');
      setRating(existingReview.rating);
      setContent(existingReview.content);
      setIsSpoiler(existingReview.isSpoiler);
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!user) {
      notify({
        title: 'Sign in to write a review',
        action: { label: 'Sign in', href: '/auth/login' },
      });
      return;
    }

    if (!content.trim()) {
      setLocalError('Please write your review');
      return;
    }

    try {
      if (isEditMode && existingReview) {
        await updateReview(existingReview.id, {
          title: title.trim() || undefined,
          content: content.trim(),
          rating,
          isSpoiler,
        });
      } else {
        await createReview({
          gameId,
          title: title.trim() || undefined,
          content: content.trim(),
          rating,
          isSpoiler,
        });
      }
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} review`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit review' : 'Write a review'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your rating and thoughts for this game.'
              : 'Rate the game out of ten and tell other players what you thought.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">
              Title <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="A headline for your review"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="review-rating">Rating</Label>
            <StarRating
              value={rating}
              onChange={setRating}
              max={10}
              size={28}
              disabled={isLoading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="review-content">Your review</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Share your thoughts about this game"
              required
            />
          </div>

          {/* Spoiler Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isSpoiler"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="size-4 shrink-0 cursor-pointer rounded border border-border-strong accent-primary"
            />
            <label htmlFor="isSpoiler" className="cursor-pointer text-sm text-foreground">
              This review contains spoilers
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-error bg-error/10 p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="mt-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isLoading}>
              {isEditMode ? 'Update review' : 'Submit review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
