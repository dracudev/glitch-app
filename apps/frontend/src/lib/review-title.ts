import type { ReviewResponse } from '@glitch/shared-types';

// Shared by the SSR route and the review island, which rewrites document.title after an edit.
export function reviewPageTitle(review: Pick<ReviewResponse, 'title' | 'user'>): string {
  return `${review.title} - A review by ${review.user.username} | Glitch`;
}
