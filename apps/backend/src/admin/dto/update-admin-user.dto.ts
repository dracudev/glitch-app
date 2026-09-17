import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: 'gamer123@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'gamer123', minLength: 3, maxLength: 30 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'Awesome Gamer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  /** Omit to leave the current password untouched. Hashed before storage. */
  @ApiPropertyOptional({ example: 'correct-horse-battery', minLength: 8, maxLength: 72 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
