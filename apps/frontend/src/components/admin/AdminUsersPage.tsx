import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from 'lucide-react';
import type { AdminUser, AdminUsersQuery, AdminUsersSortBy, PaginatedResponse, UserRole } from '@glitch/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { deleteAdminUser, getAdminUsers } from '@/services/admin';
import { notify } from '@/stores/notifications';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminUserDialog from './AdminUserDialog';

const PAGE_SIZE = 20;

const ROLE_FILTERS = [
  { value: 'all', label: 'All roles' },
  { value: 'USER', label: 'User' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

const roleTone: Record<UserRole, string> = {
  ADMIN: 'border-primary/40 text-primary',
  MODERATOR: 'border-accent/40 text-accent',
  USER: 'border-border text-muted-foreground',
};

const headerCell = 'px-4 py-3 text-left text-xs font-medium text-muted-foreground';
const bodyCell = 'px-4 py-3 align-middle';

const SORTABLE: { field: AdminUsersSortBy; label: string }[] = [
  { field: 'username', label: 'User' },
  { field: 'email', label: 'Email' },
  { field: 'role', label: 'Role' },
  { field: 'createdAt', label: 'Joined' },
];

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface AdminUsersPageProps {
  initialData: PaginatedResponse<AdminUser> | null;
}

/**
 * User administration table.
 *
 * `initialData` comes from the Astro SSR pass so the first paint already has
 * rows; every later change (filters, paging, mutations) refetches here.
 */
export default function AdminUsersPage({ initialData }: AdminUsersPageProps) {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [sortBy, setSortBy] = useState<AdminUsersSortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const query = useMemo<AdminUsersQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      role: role === 'all' ? undefined : (role as UserRole),
      sortBy,
      sortOrder,
    }),
    [page, search, role, sortBy, sortOrder],
  );

  // Only the newest request may write state; a slow page must not overwrite a fast one.
  const requestId = useRef(0);

  const load = useCallback(async (nextQuery: AdminUsersQuery) => {
    const id = ++requestId.current;
    setIsLoading(true);

    try {
      const result = await getAdminUsers(nextQuery);
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
    } catch (loadError) {
      if (id !== requestId.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Could not load users');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, []);

  const skipInitialFetch = useRef(true);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void load(query);
  }, [query, load]);

  // Debounce the search box so each keystroke is not a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: AdminUsersSortBy) => {
    if (field === sortBy) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await deleteAdminUser(user.id);
      notify({ title: `Deleted ${user.username}`, tone: 'success' });
      const isLastRowOnPage = data?.items.length === 1 && page > 1;
      if (isLastRowOnPage) setPage((current) => current - 1);
      else await load(query);
    } catch (deleteError) {
      notify({
        title: deleteError instanceof Error ? deleteError.message : 'Could not delete user',
        tone: 'error',
      });
    }
  };

  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search username, email or name"
          aria-label="Search users"
          className="w-full sm:max-w-xs"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <Select
          ariaLabel="Filter by role"
          value={role}
          onValueChange={(next) => {
            setRole(next);
            setPage(1);
          }}
          options={ROLE_FILTERS}
        />

        <Button
          className="ml-auto"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setEditing(null)}
        >
          Create user
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table
            className={`w-full min-w-[52rem] text-sm ${isLoading ? 'opacity-60' : ''}`}
            aria-busy={isLoading}
          >
            <thead>
              <tr className="border-b border-border">
                {SORTABLE.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className={headerCell}
                    aria-sort={
                      sortBy === column.field
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
                      onClick={() => handleSort(column.field)}
                    >
                      {column.label}
                      {sortBy === column.field ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" />
                      )}
                    </button>
                  </th>
                ))}
                <th scope="col" className={headerCell}>
                  Reviews
                </th>
                <th scope="col" className={`${headerCell} text-right`}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {data?.items.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className={bodyCell}>
                    <span className="block font-medium text-foreground">{user.username}</span>
                    {user.displayName && (
                      <span className="block text-xs text-muted-foreground">
                        {user.displayName}
                      </span>
                    )}
                  </td>

                  <td className={`${bodyCell} text-muted-foreground`}>{user.email}</td>

                  <td className={bodyCell}>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${roleTone[user.role]}`}
                    >
                      {user.role.toLowerCase()}
                    </span>
                  </td>

                  <td className={`${bodyCell} font-mono text-xs text-muted-foreground`}>
                    {formatDate(user.createdAt)}
                  </td>

                  <td className={`${bodyCell} font-mono text-xs text-muted-foreground`}>
                    {user.stats.reviewsCount}
                  </td>

                  <td className={`${bodyCell} text-right whitespace-nowrap`}>
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={`/profile/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(user)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:bg-error/10 hover:text-error"
                      onClick={() => setDeleting(user)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{meta?.total ?? 0}</span> users
        </p>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page <span className="font-mono">{page}</span> of{' '}
            <span className="font-mono">{totalPages}</span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AdminUserDialog
        target={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => void load(query)}
      />

      <AdminConfirmDialog
        open={deleting !== null}
        title="Delete user"
        description={
          deleting
            ? `Deleting ${deleting.username} also removes their reviews, likes and comments. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => (deleting ? handleDelete(deleting) : Promise.resolve())}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
