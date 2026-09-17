import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { REVIEWS_CONSTANTS } from '../constants/reviews.constants';

export class ReviewsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: REVIEWS_CONSTANTS.PAGINATION.DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = REVIEWS_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    example: 12,
    description: 'Number of items per page',
    default: REVIEWS_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(REVIEWS_CONSTANTS.PAGINATION.MAX_LIMIT)
  limit?: number = REVIEWS_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    example: 'epic adventure',
    description: 'Search in review title and content',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'cm2a3b4c5d6e7f8g9h0i',
    description: 'Filter by game ID',
  })
  @IsOptional()
  @IsString()
  gameId?: string;

  @ApiPropertyOptional({
    example: 'cm2a3b4c5d6e7f8g9h0i',
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    example: 7.0,
    description: 'Minimum rating filter',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(REVIEWS_CONSTANTS.VALIDATION.MIN_RATING)
  @Max(REVIEWS_CONSTANTS.VALIDATION.MAX_RATING)
  minRating?: number;

  @ApiPropertyOptional({
    example: 9.0,
    description: 'Maximum rating filter',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(REVIEWS_CONSTANTS.VALIDATION.MIN_RATING)
  @Max(REVIEWS_CONSTANTS.VALIDATION.MAX_RATING)
  maxRating?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by published status',
  })
  @IsOptional()
  // Pin the type to String: with `enableImplicitConversion` the global
  // ValidationPipe would coerce "false" to `true` (Boolean('false') === true)
  // before the transform below ever sees the raw query param.
  @Type(() => String)
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by spoiler status',
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isSpoiler?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
    enum: Object.values(REVIEWS_CONSTANTS.SORT_OPTIONS),
    default: REVIEWS_CONSTANTS.SORT_OPTIONS.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(REVIEWS_CONSTANTS.SORT_OPTIONS)
  sortBy?: string = REVIEWS_CONSTANTS.SORT_OPTIONS.CREATED_AT;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: Object.values(REVIEWS_CONSTANTS.SORT_ORDERS),
    default: REVIEWS_CONSTANTS.SORT_ORDERS.DESC,
  })
  @IsOptional()
  @IsEnum(REVIEWS_CONSTANTS.SORT_ORDERS)
  sortOrder?: 'asc' | 'desc' = REVIEWS_CONSTANTS.SORT_ORDERS.DESC;
}
