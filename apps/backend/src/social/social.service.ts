import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from '@/users/users.service';
import {
  ActivityFeedQueryDto,
  ActivityFeedResponseDto,
  ActivityItemDto,
  SocialStatsDto,
} from './dto';
import { SOCIAL_CONSTANTS } from './constants/social.constants';

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.usersService.findById(followingId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('You are not following this user');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  async getActivityFeed(
    userId: string,
    query: ActivityFeedQueryDto,
  ): Promise<ActivityFeedResponseDto> {
    const {
      page = SOCIAL_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = SOCIAL_CONSTANTS.FEED.DEFAULT_LIMIT,
      type,
    } = query;

    const skip = (page - 1) * limit;

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    followingIds.push(userId);

    const reviewsQuery = this.prisma.review.findMany({
      where: {
        userId: { in: followingIds },
        isPublished: true,
        ...(type === SOCIAL_CONSTANTS.ACTIVITY_TYPES.REVIEW ? {} : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    const followsQuery =
      type === SOCIAL_CONSTANTS.ACTIVITY_TYPES.FOLLOW || !type
        ? this.prisma.follow.findMany({
            where: {
              followerId: { in: followingIds },
            },
            include: {
              follower: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
              following: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
          })
        : Promise.resolve([]);

    const [reviews, follows] = await Promise.all([reviewsQuery, followsQuery]);

    const activities: ActivityItemDto[] = [];

    reviews.forEach((review) => {
      activities.push({
        id: `review_${review.id}`,
        type: SOCIAL_CONSTANTS.ACTIVITY_TYPES.REVIEW,
        userId: review.userId,
        user: review.user,
        targetId: review.gameId,
        targetType: 'game',
        review: {
          id: review.id,
          title: review.title,
          content: review.content,
          rating: review.rating,
          game: review.game,
          stats: {
            likesCount: review._count.likes,
            commentsCount: review._count.comments,
          },
        },
        createdAt: review.createdAt,
      });
    });

    follows.forEach((follow) => {
      activities.push({
        id: `follow_${follow.followerId}_${follow.followingId}`,
        type: SOCIAL_CONSTANTS.ACTIVITY_TYPES.FOLLOW,
        userId: follow.followerId,
        user: follow.follower,
        targetId: follow.followingId,
        targetType: 'user',
        followedUser: follow.following,
        createdAt: follow.createdAt,
      });
    });

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const paginatedActivities = activities.slice(0, limit);
    const total = activities.length;

    return {
      items: paginatedActivities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getSocialStats(userId: string): Promise<SocialStatsDto> {
    const [followersCount, followingCount, reviewsCount, likesReceived] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.review.count({ where: { userId, isPublished: true } }),
      this.prisma.like.count({
        where: {
          review: {
            userId,
            isPublished: true,
          },
        },
      }),
    ]);

    return {
      followersCount,
      followingCount,
      reviewsCount,
      likesReceived,
    };
  }

  async getMutualFollows(userId1: string, userId2: string): Promise<string[]> {
    const [user1Following, user2Following] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId1 },
        select: { followingId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId2 },
        select: { followingId: true },
      }),
    ]);

    const user1FollowingIds = new Set(user1Following.map((f) => f.followingId));
    const user2FollowingIds = new Set(user2Following.map((f) => f.followingId));

    return Array.from(user1FollowingIds).filter((id) => user2FollowingIds.has(id));
  }

  async getFollowSuggestions(userId: string, limit: number = 10): Promise<any[]> {
    // Follows of the user's follows that the user does not already follow.
    const suggestions = await this.prisma.$queryRaw`
      SELECT DISTINCT u.id, u.username, u."displayName", u.avatar, 
             COUNT(f2.id) as mutual_follows_count
      FROM users u
      INNER JOIN follows f1 ON u.id = f1."followingId"
      INNER JOIN follows f2 ON f1."followerId" = f2."followingId"
      WHERE f2."followerId" = ${userId}
        AND u.id != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM follows f3 
          WHERE f3."followerId" = ${userId} 
          AND f3."followingId" = u.id
        )
      GROUP BY u.id, u.username, u."displayName", u.avatar
      ORDER BY mutual_follows_count DESC, u."createdAt" DESC
      LIMIT ${limit}
    `;

    return suggestions as any[];
  }
}
