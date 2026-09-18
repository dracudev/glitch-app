import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// These shapes mirror the IGDB taxonomy, so ids are the numeric IGDB ids — the same
// values the /games filters accept, which lets the UI filter by what it renders.

export class GameGenreDto {
  @ApiProperty({ example: 12, description: 'IGDB genre id' })
  id: number;

  @ApiProperty({ example: 'Role-playing (RPG)' })
  name: string;

  @ApiProperty({ example: 'role-playing-rpg' })
  slug: string;
}

export class GamePlatformDto {
  @ApiProperty({ example: 6, description: 'IGDB platform id' })
  id: number;

  @ApiProperty({ example: 'PC (Microsoft Windows)' })
  name: string;

  @ApiProperty({ example: 'pc' })
  slug: string;

  @ApiPropertyOptional({ example: 'PC' })
  abbreviation?: string;
}

export class GameCompanyDto {
  @ApiProperty({ example: 1234, description: 'IGDB company id' })
  id: number;

  @ApiProperty({ example: 'CD Projekt RED' })
  name: string;

  @ApiProperty({ example: 'cd-projekt-red' })
  slug: string;
}

export class GameBasicDto {
  @ApiProperty({ example: '1942', description: 'IGDB game id' })
  id: string;

  @ApiProperty({ example: 'The Witcher 3: Wild Hunt' })
  title: string;

  @ApiProperty({ example: 'the-witcher-3-wild-hunt' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg' })
  coverImage?: string;

  @ApiPropertyOptional({ example: '2015-05-19T00:00:00.000Z' })
  releaseDate?: Date;

  @ApiProperty({ example: 'RELEASED' })
  status: string;

  @ApiPropertyOptional({ example: 7.8, description: 'Glitch community score (0-10) from published reviews' })
  averageRating?: number;

  @ApiProperty({ example: 3, description: 'Glitch review count (0 = not reviewed here yet)' })
  reviewCount: number;

  @ApiPropertyOptional({ example: 8.7, description: 'IGDB reference score (0-10) — external context, not the Glitch score' })
  igdbRating?: number;

  @ApiPropertyOptional({ example: 1250, description: 'Number of IGDB ratings behind igdbRating' })
  igdbRatingCount?: number;
}

export class GameResponseDto {
  @ApiProperty({ type: GameBasicDto })
  game: GameBasicDto;

  @ApiPropertyOptional({ example: 'An epic open-world RPG adventure...' })
  description?: string;

  @ApiPropertyOptional({ example: 'Award-winning RPG from CD Projekt RED' })
  summary?: string;

  @ApiProperty({ example: ['https://images.igdb.com/igdb/image/upload/t_screenshot_med/abc.jpg'] })
  screenshots: string[];

  @ApiProperty({ example: ['https://www.youtube.com/watch?v=abc123'] })
  videos: string[];

  @ApiPropertyOptional({ type: GameCompanyDto })
  developer?: GameCompanyDto;

  @ApiPropertyOptional({ type: GameCompanyDto })
  publisher?: GameCompanyDto;

  @ApiProperty({ type: [GameGenreDto] })
  genres: GameGenreDto[];

  @ApiProperty({ type: [GamePlatformDto] })
  platforms: GamePlatformDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-16T15:45:00.000Z' })
  updatedAt: Date;
}

// Served by GET /games/filters so the UI can build its filter sidebar from the
// live IGDB taxonomy instead of a local copy that drifts out of sync.
export class GameFilterOptionsDto {
  @ApiProperty({ type: [GameGenreDto] })
  genres: GameGenreDto[];

  @ApiProperty({ type: [GamePlatformDto] })
  platforms: GamePlatformDto[];
}
