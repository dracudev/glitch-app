import { ApiProperty } from '@nestjs/swagger';

export class UsersByRoleDto {
  @ApiProperty({ example: 120 })
  USER: number;

  @ApiProperty({ example: 2 })
  ADMIN: number;

  @ApiProperty({ example: 4 })
  MODERATOR: number;
}

export class AdminStatsDto {
  @ApiProperty({ example: 126 })
  totalUsers: number;

  @ApiProperty({ example: 842 })
  totalGames: number;

  @ApiProperty({ example: 531 })
  totalReviews: number;

  @ApiProperty({ example: 498 })
  publishedReviews: number;

  @ApiProperty({ example: 33 })
  hiddenReviews: number;

  @ApiProperty({ example: 7 })
  newUsersLast7Days: number;

  @ApiProperty({ example: 41 })
  newReviewsLast7Days: number;

  @ApiProperty({ type: UsersByRoleDto })
  usersByRole: UsersByRoleDto;
}
