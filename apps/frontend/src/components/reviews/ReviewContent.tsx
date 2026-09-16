import { Info, TriangleAlert } from 'lucide-react';
import type { ReviewResponse } from '@glitch/shared-types';

// ============================================================================
// Props Interface
// ============================================================================

interface ReviewContentProps {
  review: ReviewResponse;
}

// ============================================================================
// ReviewContent Component
// ============================================================================

/**
 * Review content component displaying the review body
 *
 * Renders the review title and full content with proper formatting.
 * Handles whitespace, paragraphs, and spoiler warnings.
 *
 * @example
 * ```tsx
 * <ReviewContent review={reviewData} />
 * ```
 */
export default function ReviewContent({ review }: ReviewContentProps) {
  // ============================================================================
  // Content Formatting
  // ============================================================================

  /**
   * Format review content with proper paragraph breaks
   */
  const formatContent = (content: string) => {
    // Split by double newlines to create paragraphs
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, index) => {
      // Replace single newlines with <br /> within paragraphs
      const formattedParagraph = paragraph.split('\n').map((line, lineIndex) => (
        <span key={lineIndex}>
          {line}
          {lineIndex < paragraph.split('\n').length - 1 && <br />}
        </span>
      ));

      return <p key={index}>{formattedParagraph}</p>;
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <article className="rounded-lg border border-border bg-card p-4 md:p-6 lg:p-8">
      {/* Spoiler Warning Banner */}
      {review.isSpoiler && (
        <div className="mb-6 rounded-md border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-6 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-warning">Spoiler warning</h3>
              <p className="text-sm text-muted-foreground">
                This review contains spoilers for {review.game.title}. Read at your own discretion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Title */}
      {review.title && (
        <h2 className="mb-6 text-xl font-semibold leading-tight">{review.title}</h2>
      )}

      {/* Review Content — long-form reading copy */}
      <div className="prose-body whitespace-pre-wrap">{formatContent(review.content)}</div>

      {/* Publication Status Badge (for unpublished reviews) */}
      {!review.isPublished && (
        <div className="mt-6 rounded-md border border-border bg-muted p-3">
          <div className="flex items-center gap-2">
            <Info className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              This review is currently unpublished and only visible to you.
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
