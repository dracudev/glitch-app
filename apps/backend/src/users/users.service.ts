import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserResponseDto,
  UserProfileDto,
} from './dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { USERS_CONSTANTS } from './constants/users.constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: createUserDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.[0];
          throw new ConflictException(`${field} already exists`);
        }
      }
      throw error;
    }
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const {
      page = USERS_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = USERS_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      search,
    } = paginationQuery;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          location: true,
          website: true,
          isPrivate: true,
          createdAt: true,
          _count: {
            select: {
              reviews: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((user) => this.toUserResponseDto(user));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  async getProfile(username: string, currentUserId?: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
            gameLists: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { followerId: true },
            }
          : false,
        reviews: {
          where: { isPublished: true },
          take: USERS_CONSTANTS.PROFILE.RECENT_REVIEWS_LIMIT,
          orderBy: { createdAt: 'desc' },
          include: {
            game: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
        gameLists: {
          where: { isPublic: true },
          take: USERS_CONSTANTS.PROFILE.RECENT_GAME_LISTS_LIMIT,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                entries: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isPrivate && currentUserId !== user.id) {
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: null,
        location: null,
        website: null,
        isPrivate: true,
        createdAt: user.createdAt,
        stats: {
          reviewsCount: 0,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          gameListsCount: 0,
        },
        isFollowing: currentUserId ? user.followers.length > 0 : false,
        recentReviews: [],
        gameLists: [],
      };
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      stats: {
        reviewsCount: user._count.reviews,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        gameListsCount: user._count.gameLists,
      },
      isFollowing: currentUserId ? user.followers.length > 0 : false,
      recentReviews: user.reviews.map((review) => ({
        id: review.id,
        title: review.title,
        content:
          review.content.substring(0, USERS_CONSTANTS.PROFILE.REVIEW_CONTENT_PREVIEW_LENGTH) +
          (review.content.length > USERS_CONSTANTS.PROFILE.REVIEW_CONTENT_PREVIEW_LENGTH
            ? '...'
            : ''),
        rating: review.rating,
        createdAt: review.createdAt,
        game: review.game,
        stats: {
          likesCount: review._count.likes,
          commentsCount: review._count.comments,
        },
      })),
      gameLists: user.gameLists,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.[0];
          throw new ConflictException(`${field} already exists`);
        }
      }
      throw error;
    }
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return this.toUserResponseDto(updatedUser);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async updateResetToken(id: string, resetToken: string): Promise<void> {
    await this.prisma.userSession.create({
      data: {
        userId: id,
        token: resetToken,
        expiresAt: new Date(
          Date.now() + USERS_CONSTANTS.SESSION.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
        ),
      },
    });
  }

  async clearResetToken(id: string): Promise<void> {
    await this.prisma.userSession.deleteMany({
      where: {
        userId: id,
        expiresAt: { lt: new Date() },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async getFollowers(
    username: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const {
      page = USERS_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = USERS_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    } = paginationQuery;
    const skip = (page - 1) * limit;

    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: user.id },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              location: true,
              website: true,
              isPrivate: true,
              createdAt: true,
              _count: {
                select: {
                  reviews: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: user.id } }),
    ]);

    const items = followers.map((follow) => this.toUserResponseDto(follow.follower));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(
    username: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const {
      page = USERS_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = USERS_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    } = paginationQuery;
    const skip = (page - 1) * limit;

    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: user.id },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              bio: true,
              location: true,
              website: true,
              isPrivate: true,
              createdAt: true,
              _count: {
                select: {
                  reviews: true,
                  followers: true,
                  following: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    const items = following.map((follow) => this.toUserResponseDto(follow.following));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toUserResponseDto(user: any): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      stats: {
        reviewsCount: user._count?.reviews || 0,
        followersCount: user._count?.followers || 0,
        followingCount: user._count?.following || 0,
      },
    };
  }
}
