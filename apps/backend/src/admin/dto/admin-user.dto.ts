import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AdminUserStatsDto {
  @ApiProperty({ example: 15 })
  reviewsCount: number;

  @ApiProperty({ example: 42 })
  followersCount: number;
}

/**
 * Admin-facing user row. Unlike `UserResponseDto` this exposes `email` and
 * `role`, which is why it never leaves the ADMIN-guarded admin controller.
 */
export class AdminUserDto {
  @ApiProperty({ example: 'cm2a3b4c5d6e7f8g9h0i' })
  id: string;

  @ApiProperty({ example: 'gamer123@example.com' })
  email: string;

  @ApiProperty({ example: 'gamer123' })
  username: string;

  @ApiPropertyOptional({ example: 'Awesome Gamer' })
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: AdminUserStatsDto })
  stats: AdminUserStatsDto;
}
