import { useEffect, useState } from 'react';
import type { ReviewResponse } from '@glitch/shared-types';

// Components
import ReviewHeader from './ReviewHeader';
import ReviewContent from './ReviewContent';
import ReviewActions from './ReviewActions';
import ReviewFormDialog from '@/components/games/ReviewFormDialog';

// Stores
import { setReviewDetail } from '@/stores/reviews';
import { useReviewDetail } from '@/hooks/useReviews';

// Lib
import { reviewPageTitle } from '@/lib/review-title';

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

  // The stored copy is what edits write to, so render it once it is hydrated.
  // Without this the page keeps showing the stale server-rendered prop and an
  // edit only becomes visible after a manual reload.
  const { review: storeReview } = useReviewDetail();
  const liveReview = storeReview?.id === review.id ? storeReview : review;

  // The <head> title is server-rendered once, so an edit would leave the old
  // title sitting in the tab. Mirror it from whichever copy is being rendered.
  useEffect(() => {
    document.title = reviewPageTitle(liveReview);
  }, [liveReview]);

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
          <ReviewHeader review={liveReview} />

          {/* Review Content - Title & Body */}
          <div className="mt-6 md:mt-8">
            <ReviewContent review={liveReview} />
          </div>

          {/* Review Actions - Like, Comment, Share, Edit/Delete */}
          <div className="mt-6 md:mt-8 pt-6 border-t border-border">
            <ReviewActions
              review={liveReview}
              onEdit={() => setIsEditDialogOpen(true)}
              onDeleted={handleDeleted}
            />
          </div>
        </div>
      </div>

      {/* Edit Review Dialog */}
      <ReviewFormDialog
        gameId={liveReview.game.id}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        existingReview={liveReview}
      />
    </div>
  );
}
