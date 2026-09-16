import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary rounded-lg p-6 w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto z-50 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Review' : 'Write a Review'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-secondary-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-foreground font-semibold mb-2">
                Title <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-primary"
                placeholder="A catchy title for your review..."
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-foreground font-semibold mb-2">Rating</label>
              <StarRating
                value={rating}
                onChange={setRating}
                max={10}
                size={28}
                disabled={isLoading}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-foreground font-semibold mb-2">Your Review</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-background text-foreground border border-border rounded-md focus:outline-none focus:border-primary"
                placeholder="Share your thoughts about this game..."
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
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="isSpoiler" className="text-foreground text-sm cursor-pointer">
                This review contains spoilers
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-md">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditMode ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
