import { useState } from 'react';
import type { ReviewResponse } from '@glitch/shared-types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Heart, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { notify } from '@/stores/notifications';

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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
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
                    className="bg-popover text-popover-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg z-tooltip"
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
                    className="bg-popover text-popover-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg z-tooltip"
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
                className="bg-popover text-popover-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg z-tooltip"
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
              <button
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-transparent border border-border text-foreground
                  hover:bg-accent
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Share this review"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="font-medium hidden sm:inline">Share</span>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-popover text-popover-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg z-tooltip"
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
        <div className="mt-4 p-3 bg-state-error/10 border border-state-error rounded-md">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-state-error shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-state-error">{error}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-card rounded-lg border border-border p-6 w-[90vw] max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Review</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Tooltip.Provider>
  );
}
