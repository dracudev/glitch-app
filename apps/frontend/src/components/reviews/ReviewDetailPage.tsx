import { useEffect, useState } from 'react';
import type { ReviewResponse } from '@glitch/shared-types';

// Components
import ReviewHeader from './ReviewHeader';
import ReviewContent from './ReviewContent';
import ReviewActions from './ReviewActions';
import ReviewFormDialog from '@/components/games/ReviewFormDialog';

// Stores
import { setReviewDetail } from '@/stores/reviews';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewDetailPageProps {
  review: ReviewResponse;
}

// ============================================================================
// ReviewDetailPage Component
// ============================================================================

/**
 * Review detail page component (React Island)
 *
 * Main container for displaying full review details.
 * Hydrated by Astro with server-rendered review data.
 * Supports edit/delete for review owners.
 *
 * @example
 * ```tsx
 * <ReviewDetailPage review={reviewData} client:load />
 * ```
 */
export default function ReviewDetailPage({ review }: ReviewDetailPageProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // ============================================================================
  // Initialization Effect
  // ============================================================================

  useEffect(() => {
    // Hydrate global store with server-rendered data
    setReviewDetail(review, review.id);
  }, [review]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleDeleted = () => {
    setIsDeleted(true);
    // Navigate back to reviews list
    window.location.href = '/reviews';
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isDeleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg font-semibold">Review deleted</p>
          <p className="text-muted-foreground text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Container - Mobile-First Responsive */}
      <div className="shell py-8 lg:py-10">
        <div className="mx-auto max-w-4xl">
          {/* Review Header - Game, User, Rating */}
          <ReviewHeader review={review} />

          {/* Review Content - Title & Body */}
          <div className="mt-6 md:mt-8">
            <ReviewContent review={review} />
          </div>

          {/* Review Actions - Like, Comment, Share, Edit/Delete */}
          <div className="mt-6 md:mt-8 pt-6 border-t border-border">
            <ReviewActions
              review={review}
              onEdit={() => setIsEditDialogOpen(true)}
              onDeleted={handleDeleted}
            />
          </div>
        </div>
      </div>

      {/* Edit Review Dialog */}
      <ReviewFormDialog
        gameId={review.game.id}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        existingReview={review}
      />
    </div>
  );
}
