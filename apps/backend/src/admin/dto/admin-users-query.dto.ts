import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto';

export const ADMIN_USERS_SORT_FIELDS = ['username', 'email', 'createdAt', 'role'] as const;
export type AdminUsersSortBy = (typeof ADMIN_USERS_SORT_FIELDS)[number];

export class AdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: ADMIN_USERS_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(ADMIN_USERS_SORT_FIELDS)
  sortBy?: AdminUsersSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
