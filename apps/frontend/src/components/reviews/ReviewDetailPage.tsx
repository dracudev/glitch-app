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

// Props Interface

interface ReviewDetailPageProps {
  review: ReviewResponse;
}

export default function ReviewDetailPage({ review }: ReviewDetailPageProps) {
  // State

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Initialization Effect

  useEffect(() => {
    setReviewDetail(review, review.id);
  }, [review]);

  // Render the hydrated store copy so edits show without a manual reload.
  const { review: storeReview } = useReviewDetail();
  const liveReview = storeReview?.id === review.id ? storeReview : review;

  // <head> title is server-rendered once; mirror it from the live copy after edits.
  useEffect(() => {
    document.title = reviewPageTitle(liveReview);
  }, [liveReview]);

  // Handlers

  const handleDeleted = () => {
    setIsDeleted(true);
    window.location.href = '/reviews';
  };

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
      <div className="shell py-8 lg:py-10">
        <div className="mx-auto max-w-4xl">
          <ReviewHeader review={liveReview} />

          <div className="mt-6 md:mt-8">
            <ReviewContent review={liveReview} />
          </div>

          <div className="mt-6 md:mt-8 pt-6 border-t border-border">
            <ReviewActions
              review={liveReview}
              onEdit={() => setIsEditDialogOpen(true)}
              onDeleted={handleDeleted}
            />
          </div>
        </div>
      </div>

      <ReviewFormDialog
        gameId={liveReview.game.id}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        existingReview={liveReview}
      />
    </div>
  );
}
