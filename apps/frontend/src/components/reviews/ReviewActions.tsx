import { useState } from 'react';
import type { ReviewResponse } from '@glitch/shared-types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CircleX, Heart, Edit, MessageSquare, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { notify } from '@/stores/notifications';

/** One tooltip surface for every trigger on this bar. */
const tooltipStyles =
  'z-popover rounded-md border border-border bg-popover px-3 py-2 text-sm font-medium text-popover-foreground shadow-lg';

// Hooks
import { useReviewActions } from '@/hooks/useReviews';
import { useStore } from '@nanostores/react';
import { $reviewDetail } from '@/stores/reviews';
import { $currentUser } from '@/stores/auth';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewActionsProps {
  review: ReviewResponse;
  /** Called when edit button is clicked (for owner to open edit dialog) */
  onEdit?: () => void;
  /** Called after successful deletion */
  onDeleted?: () => void;
}

// ============================================================================
// ReviewActions Component
// ============================================================================

/**
 * Review actions component with social interactions
 *
 * Provides like/unlike functionality with optimistic updates.
 * Uses Radix UI tooltips for accessibility.
 *
 * @example
 * ```tsx
 * <ReviewActions review={reviewData} />
 * ```
 */
export default function ReviewActions({
  review: initialReview,
  onEdit,
  onDeleted,
}: ReviewActionsProps) {
  // ============================================================================
  // State & Hooks
  // ============================================================================

  // Get current user for ownership check
  const currentUser = useStore($currentUser);
  const isOwner = currentUser?.id === initialReview.user.id;

  // Get current review from store (for optimistic updates)
  const currentReview = useStore($reviewDetail) || initialReview;

  // Review actions hook
  const { likeReview, unlikeReview, deleteReview, isLoading, error } = useReviewActions();

  // Local loading states
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle like/unlike toggle
   */
  const handleLikeToggle = async () => {
    if (isLiking) return;
    if (!currentUser) {
      notify({
        title: 'Sign in to like reviews',
        action: { label: 'Sign in', href: '/auth/login' },
      });
      return;
    }

    setIsLiking(true);

    try {
      if (currentReview.isLiked) {
        await unlikeReview(currentReview.id);
      } else {
        await likeReview(currentReview.id);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  /**
   * Handle review deletion with confirmation
   */
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteReview(currentReview.id);
      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Social Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {/* Likes Count */}
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">
              {currentReview.stats.likesCount}{' '}
              {currentReview.stats.likesCount === 1 ? 'like' : 'likes'}
            </span>
          </div>

          {/* Comments Count */}
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5" aria-hidden="true" />
            <span className="font-medium">
              {currentReview.stats.commentsCount}{' '}
              {currentReview.stats.commentsCount === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Owner Actions: Edit + Delete */}
          {isOwner && (
            <>
              {/* Edit Button */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    onClick={onEdit}
                    disabled={isLoading}
                    variant="outline"
                    leftIcon={<Edit className="w-5 h-5" aria-hidden="true" />}
                    aria-label="Edit this review"
                  >
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className={tooltipStyles}
                    sideOffset={5}
                  >
                    Edit this review
                    <Tooltip.Arrow className="fill-popover" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>

              {/* Delete Button */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting || isLoading}
                    variant="outline"
                    leftIcon={
                      <Trash2 className="w-5 h-5 text-destructive" aria-hidden="true" />
                    }
                    aria-label="Delete this review"
                  >
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className={tooltipStyles}
                    sideOffset={5}
                  >
                    Delete this review
                    <Tooltip.Arrow className="fill-popover" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </>
          )}

          {/* Like Button with Tooltip */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                onClick={handleLikeToggle}
                disabled={isLiking || isLoading}
                variant={currentReview.isLiked ? 'primary' : 'outline'}
                leftIcon={
                  <Heart
                    className={`w-5 h-5 transition-transform ${isLiking ? 'scale-110' : ''}`}
                    fill={currentReview.isLiked ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                }
                aria-label={currentReview.isLiked ? 'Unlike this review' : 'Like this review'}
                aria-pressed={currentReview.isLiked}
              >
                {currentReview.isLiked ? 'Liked' : 'Like'}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className={tooltipStyles}
                sideOffset={5}
              >
                {currentReview.isLiked ? 'Unlike this review' : 'Like this review'}
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {/* Share Button with Tooltip */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                variant="outline"
                leftIcon={<Share2 className="size-5" aria-hidden="true" />}
                aria-label="Share this review"
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: currentReview.title || `${currentReview.game.title} Review`,
                        text: `Check out this review of ${currentReview.game.title} by ${currentReview.user.displayName}`,
                        url,
                      })
                      .catch(() => {
                        // User cancelled or error - fallback to clipboard
                        navigator.clipboard.writeText(url);
                      });
                  } else {
                    // Fallback to clipboard
                    navigator.clipboard.writeText(url);
                  }
                }}
              >
                <span className="hidden sm:inline">Share</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className={tooltipStyles}
                sideOffset={5}
              >
                Share this review
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error rounded-md">
          <div className="flex items-start gap-2">
            <CircleX className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation — a real dialog: focus trap, Escape, scroll lock,
          restore-focus, role/aria-modal, all from the shared primitive. */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete review</DialogTitle>
            <DialogDescription>
              This permanently removes your review and its likes. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
              Delete review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tooltip.Provider>
  );
}
