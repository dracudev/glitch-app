import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameResponseDto } from './game-response.dto';

export class ReviewUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  avatar?: string;
}

export class ReviewStatsDto {
  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;
}

export class GameReviewDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: ReviewUserDto })
  user: ReviewUserDto;

  @ApiProperty({ type: ReviewStatsDto })
  stats: ReviewStatsDto;
}

export class GameDetailDto extends GameResponseDto {
  @ApiProperty({ type: [GameReviewDto] })
  recentReviews: GameReviewDto[];
}
