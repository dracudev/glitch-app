import type { ReviewResponse } from '@glitch/shared-types';

/**
 * The `<title>` for a review detail page.
 *
 * Shared by the SSR route (which renders it into `<head>`) and the review detail
 * island, which rewrites `document.title` after an edit so the tab does not keep
 * showing the pre-edit title.
 */
export function reviewPageTitle(review: Pick<ReviewResponse, 'title' | 'user'>): string {
  return `${review.title} - A review by ${review.user.username} | Glitch`;
}
