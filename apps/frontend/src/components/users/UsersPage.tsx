import { useEffect, useRef, useState } from 'react';
import type { UserResponse, PaginatedResponse } from '@glitch/shared-types';
import { getUsers } from '@/services/users';
import { getAvatarUrl } from '@/lib/avatar';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

interface UsersPageProps {
  initialData: PaginatedResponse<UserResponse> | null;
}

export default function UsersPage({ initialData }: UsersPageProps) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<PaginatedResponse<UserResponse> | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip the mount run so the server-rendered page is not refetched immediately.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const handle = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUsers({ search: query.trim() || undefined, page: 1, limit: 24 });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load players.');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  const loadMore = async () => {
    if (!data || data.meta.page >= data.meta.totalPages) return;
    setIsLoading(true);
    setError(null);
    try {
      const next = await getUsers({
        search: query.trim() || undefined,
        page: data.meta.page + 1,
        limit: data.meta.limit,
      });
      setData({ items: [...data.items, ...next.items], meta: next.meta });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more players.');
    } finally {
      setIsLoading(false);
    }
  };

  const users = data?.items ?? [];
  const hasNextPage = data ? data.meta.page < data.meta.totalPages : false;

  return (
    <div className="shell py-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 lg:mb-8">
          <h1 className="text-2xl tracking-tight sm:text-3xl">Players</h1>
          <p className="mt-2 text-sm text-foreground-secondary">
            Find people to follow and see what they are playing.
          </p>

          <div className="relative mt-5 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name"
              className="pl-9"
              aria-label="Search players"
            />
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 p-6 text-center"
          >
            <p className="font-semibold text-error">Could not load players</p>
            <p className="mt-1 text-sm text-error/80">{error}</p>
          </div>
        )}

        {!error && users.length === 0 && !isLoading && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground">No players found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {query ? `Nothing matches “${query}”.` : 'There are no players to show yet.'}
            </p>
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <li key={user.id}>
              <Card variant="interactive" className="h-full p-5">
                <a href={`/profile/${user.username}`} className="group flex items-start gap-4">
                  <img
                    src={getAvatarUrl(user, 96)}
                    alt=""
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                    className="size-12 shrink-0 rounded-md border border-border bg-muted object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                      {user.displayName || user.username}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="mt-2 line-clamp-2 text-sm text-foreground-secondary">
                        {user.bio}
                      </p>
                    )}
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {user.stats?.reviewsCount ?? 0} reviews · {user.stats?.followersCount ?? 0}{' '}
                      followers
                    </p>
                  </div>
                </a>
              </Card>
            </li>
          ))}
        </ul>

        {isLoading && users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading players…</p>
        )}

        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="sm" onClick={loadMore} isLoading={isLoading}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
