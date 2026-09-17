import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/database/prisma.service';
import { GamesService } from '@/games/games.service';
import { PaginatedResponseDto } from '@/common/dto';
import { BCRYPT_SALT_ROUNDS } from '@/auth/constants/auth.constants';
import {
  AdminStatsDto,
  AdminUserDto,
  AdminUsersQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatar: true,
  role: true,
  isPrivate: true,
  createdAt: true,
  _count: { select: { reviews: true, followers: true } },
} satisfies Prisma.UserSelect;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof ADMIN_USER_SELECT }>;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
  ) {}

  async getStats(): Promise<AdminStatsDto> {
    const since = new Date(Date.now() - SEVEN_DAYS_MS);

    const [
      totalUsers,
      totalGames,
      totalReviews,
      publishedReviews,
      newUsersLast7Days,
      newReviewsLast7Days,
      adminCount,
      moderatorCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.game.count(),
      this.prisma.review.count(),
      this.prisma.review.count({ where: { isPublished: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.review.count({ where: { createdAt: { gte: since } } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { role: UserRole.MODERATOR } }),
    ]);

    const usersByRole: Record<UserRole, number> = {
      USER: totalUsers - adminCount - moderatorCount,
      ADMIN: adminCount,
      MODERATOR: moderatorCount,
    };

    return {
      totalUsers,
      totalGames,
      totalReviews,
      publishedReviews,
      hiddenReviews: totalReviews - publishedReviews,
      newUsersLast7Days,
      newReviewsLast7Days,
      usersByRole,
    };
  }

  async findUsers(query: AdminUsersQueryDto): Promise<PaginatedResponseDto<AdminUserDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        select: ADMIN_USER_SELECT,
      }),
    ]);

    return {
      items: users.map(toAdminUserDto),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createUser(dto: CreateAdminUserDto): Promise<AdminUserDto> {
    const { password, ...rest } = dto;
    try {
      const user = await this.prisma.user.create({
        data: { ...rest, password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS) },
        select: ADMIN_USER_SELECT,
      });
      return toAdminUserDto(user);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  async updateUser(id: string, dto: UpdateAdminUserDto): Promise<AdminUserDto> {
    const { password, ...rest } = dto;
    const data: Prisma.UserUpdateInput = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        select: ADMIN_USER_SELECT,
      });
      return toAdminUserDto(user);
    } catch (error) {
      throw translateWriteError(error);
    }
  }

  async deleteUser(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // Reviews cascade with the user, so nothing recomputes the affected game
    // aggregates unless we do it here. Collect before the delete.
    const games = await this.prisma.review.findMany({
      where: { userId: id, isPublished: true },
      select: { gameId: true },
      distinct: ['gameId'],
    });

    await this.prisma.user.delete({ where: { id } });
    await Promise.all(games.map(({ gameId }) => this.gamesService.updateRating(gameId)));
  }
}

function toAdminUserDto(user: AdminUserRow): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName ?? undefined,
    avatar: user.avatar ?? undefined,
    role: user.role,
    isPrivate: user.isPrivate,
    createdAt: user.createdAt,
    stats: {
      reviewsCount: user._count.reviews,
      followersCount: user._count.followers,
    },
  };
}

function translateWriteError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'value';
      return new ConflictException(`${field} already exists`);
    }
    if (error.code === 'P2025') {
      return new NotFoundException('User not found');
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}
