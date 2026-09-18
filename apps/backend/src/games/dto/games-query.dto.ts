import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsEnum, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import {
  SORT_FIELDS,
  SORT_ORDERS,
  GAME_STATUS_NAMES,
  GameStatusName,
} from '../constants/games.constants';

const toIgdbIds = ({ value }: { value: unknown }): number[] | undefined => {
  const raw = Array.isArray(value) ? value : [value];
  const ids = raw
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => Number(entry.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
  return ids.length > 0 ? ids : undefined;
};

export class GamesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: [12], description: 'IGDB genre ids' })
  @IsOptional()
  @Transform(toIgdbIds)
  @IsArray()
  @IsNumber({}, { each: true })
  genreIds?: number[];

  @ApiPropertyOptional({ example: [6], description: 'IGDB platform ids' })
  @IsOptional()
  @Transform(toIgdbIds)
  @IsArray()
  @IsNumber({}, { each: true })
  platformIds?: number[];

  @ApiPropertyOptional({ enum: GAME_STATUS_NAMES })
  @IsOptional()
  @IsIn(GAME_STATUS_NAMES)
  status?: GameStatusName;

  @ApiPropertyOptional({ example: 7.0, minimum: 0, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  minRating?: number;

  @ApiPropertyOptional({ example: 9.0, minimum: 0, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRating?: number;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'igdbRating' })
  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: string;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsEnum(SORT_ORDERS)
  sortOrder?: 'asc' | 'desc';
}
