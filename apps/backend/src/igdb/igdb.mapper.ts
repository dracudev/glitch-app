import { IgdbGame } from './igdb.types';
import { GameResponseDto, GameBasicDto } from '@/games/dto/game-response.dto';
import { GameDetailDto } from '@/games/dto/game-detail.dto';
import { gameStatusFromIgdb, GameStatusName } from '@/games/constants/games.constants';

// IGDB image helper — ponytail: hardcoded sizes, change if design wants higher res
const IGDB_IMAGE_BASE = 'https://images.igdb.com/igdb/image/upload';

export function coverUrl(imageId: string, size = 't_cover_big'): string {
  return `${IGDB_IMAGE_BASE}/${size}/${imageId}.jpg`;
}

export function coverUrlFor(igdb: IgdbGame): string | null {
  return igdb.cover?.image_id ? coverUrl(igdb.cover.image_id) : null;
}

function screenshotUrl(imageId: string, size = 't_screenshot_med'): string {
  return `${IGDB_IMAGE_BASE}/${size}/${imageId}.jpg`;
}

// IGDB omits `status` on a lot of catalogue entries; those are released games.
export function mapIgdbStatus(igdbStatus?: number | null): GameStatusName {
  return gameStatusFromIgdb(igdbStatus) ?? 'RELEASED';
}

export function toGameResponseDto(igdb: IgdbGame): GameResponseDto {
  const developerCompany = igdb.involved_companies?.find((ic) => ic.developer)?.company;
  const publisherCompany = igdb.involved_companies?.find((ic) => ic.publisher)?.company;

  const gameBasic: GameBasicDto = {
    id: String(igdb.id),
    title: igdb.name,
    slug: igdb.slug,
    coverImage: coverUrlFor(igdb),
    releaseDate: igdb.first_release_date ? new Date(igdb.first_release_date * 1000) : undefined,
    status: mapIgdbStatus(igdb.status),
    averageRating: igdb.total_rating
      ? Number((igdb.total_rating / 10).toFixed(1))
      : igdb.rating
        ? Number((igdb.rating / 10).toFixed(1))
        : undefined,
    reviewCount: igdb.rating_count || 0,
  };

  return {
    game: gameBasic,
    description: igdb.storyline || igdb.summary,
    summary: igdb.summary,
    screenshots: (igdb.screenshots || []).map((s) => screenshotUrl(s.image_id)).slice(0, 8),
    videos: (igdb.videos || []).map((v) => `https://www.youtube.com/watch?v=${v.video_id}`),
    developer: developerCompany
      ? { id: developerCompany.id, name: developerCompany.name, slug: developerCompany.slug }
      : undefined,
    publisher: publisherCompany
      ? { id: publisherCompany.id, name: publisherCompany.name, slug: publisherCompany.slug }
      : undefined,
    genres: (igdb.genres || []).map((g) => ({ id: g.id, name: g.name, slug: g.slug })),
    platforms: (igdb.platforms || []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      abbreviation: p.abbreviation,
    })),
    createdAt: igdb.first_release_date ? new Date(igdb.first_release_date * 1000) : new Date(),
    updatedAt: new Date(),
  };
}

export function toGameDetailDto(igdb: IgdbGame): GameDetailDto {
  return {
    ...toGameResponseDto(igdb),
    recentReviews: [],
  };
}
