import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { PaginatedReviewsResponse, ReviewResponse, ReviewsQuery } from '@glitch/shared-types';

// Services
import { deleteAdminReview, getAdminReviews, updateAdminReview } from '@/services/admin';

// Stores
import { notify } from '@/stores/notifications';

// Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminReviewDialog from './AdminReviewDialog';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

type SortBy = NonNullable<ReviewsQuery['sortBy']>;
type SortOrder = NonNullable<ReviewsQuery['sortOrder']>;

const SORT_OPTIONS: { value: string; label: string; sortBy: SortBy; sortOrder: SortOrder }[] = [
  { value: 'createdAt:desc', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'createdAt:asc', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'updatedAt:desc', label: 'Recently updated', sortBy: 'updatedAt', sortOrder: 'desc' },
  { value: 'rating:desc', label: 'Highest rated', sortBy: 'rating', sortOrder: 'desc' },
  { value: 'rating:asc', label: 'Lowest rated', sortBy: 'rating', sortOrder: 'asc' },
  { value: 'likesCount:desc', label: 'Most liked', sortBy: 'likesCount', sortOrder: 'desc' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Hidden' },
] as const;

const SORTABLE: { field: SortBy; label: string }[] = [
  { field: 'rating', label: 'Rating' },
  { field: 'likesCount', label: 'Likes' },
  { field: 'createdAt', label: 'Created' },
];

const headerCell = 'px-4 py-3 text-left text-xs font-medium text-muted-foreground';
const bodyCell = 'px-4 py-3 align-middle';

// ============================================================================
// Helpers
// ============================================================================

/** A review with no title is identified by its opening line. */
function excerpt(review: ReviewResponse): string {
  if (review.title) return review.title;
  const text = review.content.replace(/\s+/g, ' ').trim();
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Props Interface
// ============================================================================

interface AdminReviewsPageProps {
  initialData: PaginatedReviewsResponse | null;
}

// ============================================================================
// AdminReviewsPage Component
// ============================================================================

/**
 * Review moderation table (React Island).
 *
 * Seeds from the server-rendered page and refetches on every filter change.
 * Moderation reuses the public review endpoints: the backend lets an admin past
 * the ownership check (PATCH/DELETE) and past the published-only filter (GET).
 */
export default function AdminReviewsPage({ initialData }: AdminReviewsPageProps) {
  // ============================================================================
  // State
  // ============================================================================

  const [data, setData] = useState<PaginatedReviewsResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('createdAt:desc');

  const [editing, setEditing] = useState<ReviewResponse | null>(null);
  const [deleting, setDeleting] = useState<ReviewResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useMemo<ReviewsQuery>(() => {
    const option = SORT_OPTIONS.find((item) => item.value === sort) ?? SORT_OPTIONS[0];
    return {
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      isPublished: status === 'all' ? undefined : status === 'true',
      sortBy: option.sortBy,
      sortOrder: option.sortOrder,
    };
  }, [page, search, status, sort]);

  // ============================================================================
  // Data Loading
  // ============================================================================

  // Only the newest request may write state, so a slow keystroke cannot
  // overwrite a fast one that landed after it.
  const requestId = useRef(0);

  const load = useCallback(async (nextQuery: ReviewsQuery) => {
    const id = ++requestId.current;
    setIsLoading(true);

    try {
      const result = await getAdminReviews(nextQuery);
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'Could not load reviews');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, []);

  // The server already sent page 1; skip the duplicate fetch on hydration.
  const skipInitialFetch = useRef(true);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void load(query);
  }, [query, load]);

  // Keep the URL query in step with what is typed, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSort = (field: SortBy) => {
    const option = SORT_OPTIONS.find((item) => item.value === sort) ?? SORT_OPTIONS[0];
    if (option.sortBy === field) {
      setSort(`${field}:${option.sortOrder === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field}:asc`);
    }
    setPage(1);
  };

  const handleTogglePublished = async (review: ReviewResponse) => {
    setBusyId(review.id);
    try {
      const updated = await updateAdminReview(review.id, { isPublished: !review.isPublished });
      notify({
        title: updated.isPublished ? 'Review published' : 'Review hidden',
        tone: 'success',
      });
      await load(query);
    } catch (err) {
      notify({
        title: err instanceof Error ? err.message : 'Could not update the review',
        tone: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review: ReviewResponse) => {
    setBusyId(review.id);
    try {
      await deleteAdminReview(review.id);
      notify({ title: 'Review deleted', tone: 'success' });

      // Step back a page when the last row on it disappeared.
      if (data && data.items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load(query);
      }
    } catch (err) {
      notify({
        title: err instanceof Error ? err.message : 'Could not delete the review',
        tone: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================================
  // Derived
  // ============================================================================

  const totalPages = data?.meta.totalPages ?? 1;
  const currentSort = SORT_OPTIONS.find((item) => item.value === sort) ?? SORT_OPTIONS[0];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search title or content"
          aria-label="Search reviews"
          className="w-full sm:max-w-xs"
        />

        <Select
          ariaLabel="Filter by status"
          value={status}
          onValueChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={STATUS_FILTERS}
        />

        <Select
          ariaLabel="Sort reviews"
          value={sort}
          onValueChange={(next) => {
            setSort(next);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table
            className={`w-full min-w-[56rem] text-sm ${isLoading ? 'opacity-60' : ''}`}
            aria-busy={isLoading}
          >
            <thead className="border-b border-border">
              <tr>
                <th className={headerCell} scope="col">
                  Review
                </th>
                <th className={headerCell} scope="col">
                  Author
                </th>

                {SORTABLE.map(({ field, label }) => {
                  const isActive = currentSort.sortBy === field;
                  return (
                    <th className={headerCell} scope="col" key={field}>
                      <button
                        type="button"
                        onClick={() => handleSort(field)}
                        className="flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
                        aria-sort={
                          isActive
                            ? currentSort.sortOrder === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        {label}
                        {isActive ? (
                          currentSort.sortOrder === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    </th>
                  );
                })}

                <th className={headerCell} scope="col">
                  Status
                </th>
                <th className={`${headerCell} text-right`} scope="col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {data?.items.map((review) => (
                <tr key={review.id} className="transition-colors hover:bg-secondary/40">
                  <td className={`${bodyCell} max-w-sm`}>
                    <span className="block font-medium text-foreground">{excerpt(review)}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {review.game.title}
                    </span>
                  </td>

                  <td className={`${bodyCell} text-muted-foreground`}>{review.user.username}</td>

                  <td className={`${bodyCell} font-mono text-xs text-muted-foreground`}>
                    {review.rating.toFixed(1)}
                  </td>

                  <td className={`${bodyCell} font-mono text-xs text-muted-foreground`}>
                    {review.stats.likesCount}
                  </td>

                  <td className={`${bodyCell} font-mono text-xs text-muted-foreground`}>
                    {formatDate(review.createdAt)}
                  </td>

                  <td className={bodyCell}>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        review.isPublished
                          ? 'border-success/40 text-success'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {review.isPublished ? 'Published' : 'Hidden'}
                    </span>
                  </td>

                  <td className={`${bodyCell} whitespace-nowrap text-right`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                      leftIcon={<ExternalLink className="size-3.5" />}
                    >
                      <a
                        href={`/reviews/${review.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === review.id}
                      onClick={() => void handleTogglePublished(review)}
                      leftIcon={
                        review.isPublished ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )
                      }
                    >
                      {review.isPublished ? 'Hide' : 'Publish'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(review)}
                      leftIcon={<Pencil className="size-3.5" />}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:bg-error/10 hover:text-error"
                      onClick={() => setDeleting(review)}
                      leftIcon={<Trash2 className="size-3.5" />}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {data && data.items.length === 0 && (
                <tr>
                  <td className={`${bodyCell} text-muted-foreground`} colSpan={7}>
                    No reviews match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          <p className="font-mono text-xs text-muted-foreground">{data?.meta.total ?? 0} reviews</p>

          <div className="ml-auto flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>

            <span className="font-mono text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AdminReviewDialog
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void load(query)}
      />

      <AdminConfirmDialog
        open={deleting !== null}
        title="Delete review"
        description="This permanently deletes the review along with its likes and comments. The game rating is recalculated."
        confirmLabel="Delete"
        onConfirm={() => (deleting ? handleDelete(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
