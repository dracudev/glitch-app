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
  averageRating?: number;
  reviewCount: number;
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
    | 'averageRating'
    | 'reviewCount'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
