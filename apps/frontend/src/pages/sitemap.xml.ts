import type { APIRoute } from 'astro';
import { gamesService } from '@/services/games';
import { usersService } from '@/services/users';
import { reviewsService } from '@/services/reviews';

// Server-rendered on demand so the sitemap always reflects the live catalog.
export const prerender = false;

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const STATIC_PATHS = ['/', '/games', '/reviews'];

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const buildSitemap = (urls: Iterable<string>): string => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}
</urlset>
`;

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://glitch-for-gamers.vercel.app')).origin;
  const urls = new Set(STATIC_PATHS.map((path) => new URL(path, origin).href));
  const add = (paths: string[]) => paths.forEach((path) => urls.add(new URL(path, origin).href));

  // A failing catalog call must still produce a valid sitemap, so each source is
  // fetched independently and errors are tolerated.
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const games = await gamesService.getAllGames({ page, limit: PAGE_SIZE });
      add(games.data.map((game) => `/games/${game.game.slug}`));
      if (!games.hasNextPage) break;
    }
  } catch {
    // noop
  }

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const users = await usersService.getUsers({ page, limit: PAGE_SIZE });
      add(users.items.map((user) => `/profile/${user.username}`));
      if (page >= users.meta.totalPages) break;
    }
  } catch {
    // noop
  }

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const reviews = await reviewsService.getAllReviews({ page, limit: PAGE_SIZE });
      add(
        reviews.items
          .filter((review) => review.isPublished)
          .map((review) => `/reviews/${review.id}`),
      );
      if (page >= reviews.meta.totalPages) break;
    }
  } catch {
    // noop
  }

  return new Response(buildSitemap(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
