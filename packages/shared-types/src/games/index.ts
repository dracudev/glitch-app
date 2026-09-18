import type { ReviewUser, ReviewStats } from '../reviews';

export type GameStatus =
  | 'RELEASED'
  | 'ALPHA'
  | 'BETA'
  | 'EARLY_ACCESS'
  | 'OFFLINE'
  | 'CANCELLED'
  | 'RUMORED'
  | 'DELISTED';

export interface GenreResponse {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformResponse {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string;
}

export interface GameCompany {
  id: number;
  name: string;
  slug: string;
}

export interface GameBasic {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  releaseDate?: Date;
  status: GameStatus;
  /** Glitch community score (0-10), from published reviews on this site. Absent until the first review. */
  averageRating?: number;
  /** Glitch review count. 0 means no one here has reviewed it yet. */
  reviewCount: number;
  /** External IGDB reference score (0-10). Context only — never the Glitch score. */
  igdbRating?: number;
  /** Number of IGDB ratings behind `igdbRating`. */
  igdbRatingCount?: number;
}

export interface GameResponse {
  game: GameBasic;
  description?: string;
  summary?: string;
  screenshots: string[];
  videos: string[];
  developer?: GameCompany;
  publisher?: GameCompany;
  genres: GenreResponse[];
  platforms: PlatformResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSummary {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  releaseDate?: Date;
  status: GameStatus;
  averageRating?: number;
  reviewCount: number;
  developer?: GameCompany;
  genres: GenreResponse[];
  platforms: PlatformResponse[];
}

export interface GameReview {
  id: string;
  title?: string;
  content: string;
  rating: number;
  createdAt: Date;
  user: ReviewUser;
  stats: ReviewStats;
}

export interface GameDetail extends GameResponse {
  recentReviews: GameReview[];
}

export interface GameFilterOptions {
  genres: GenreResponse[];
  platforms: PlatformResponse[];
}

export interface PaginatedGamesResponse {
  data: GameResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GamesQuery {
  page?: number;
  limit?: number;
  search?: string;
  genreIds?: number[];
  platformIds?: number[];
  status?: GameStatus;
  minRating?: number;
  maxRating?: number;
  sortBy?:
    | 'title'
    | 'releaseDate'
    | 'igdbRating'
    | 'igdbRatingCount'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
