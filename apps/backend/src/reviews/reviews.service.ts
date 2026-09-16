import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { GamesService } from '@/games/games.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
  ReviewsQueryDto,
} from './dto';
import { REVIEWS_CONSTANTS } from './constants/reviews.constants';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewResponseDto> {
    const { gameId, ...reviewData } = createReviewDto;

    const anchor = await this.gamesService.resolveAnchor(gameId);

    // Check if user already has a review for this game
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: anchor.id,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this game');
    }

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        // Create the review
        const newReview = await tx.review.create({
          data: {
            ...reviewData,
            userId,
            gameId: anchor.id,
            isPublished: reviewData.isPublished ?? true,
            isSpoiler: reviewData.isSpoiler ?? false,
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
        });

        // Update game rating if review is published
        if (newReview.isPublished) {
          await this.gamesService.updateRating(anchor.id);
        }

        return newReview;
      });

      return this.toReviewResponseDto(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('You have already reviewed this game');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid user or game ID');
        }
      }
      throw error;
    }
  }

  async findAll(
    query: ReviewsQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedReviewsResponseDto> {
    const {
      page = REVIEWS_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = REVIEWS_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      search,
      gameId,
      userId,
      minRating,
      maxRating,
      isPublished,
      isSpoiler,
      sortBy = REVIEWS_CONSTANTS.SORT_OPTIONS.CREATED_AT,
      sortOrder = REVIEWS_CONSTANTS.SORT_ORDERS.DESC,
    } = query;

    const skip = (page - 1) * limit;

    // Sanitize search term
    const sanitizedSearch = search?.trim().replace(/[<>\"']/g, '');

    let anchorId: string | undefined;
    if (gameId) {
      anchorId = (await this.toAnchorId(gameId)) ?? undefined;
      if (!anchorId) return PaginatedReviewsResponseDto.from([], page, limit, 0);
    }

    // Build where clause
    const where: Prisma.ReviewWhereInput = {
      AND: [
        // Only show published reviews unless filtering by current user
        isPublished !== undefined
          ? { isPublished }
          : userId && userId === currentUserId
            ? {}
            : { isPublished: true },
        sanitizedSearch
          ? {
              OR: [
                { title: { contains: sanitizedSearch, mode: 'insensitive' } },
                { content: { contains: sanitizedSearch, mode: 'insensitive' } },
              ],
            }
          : {},
        anchorId ? { gameId: anchorId } : {},
        userId ? { userId } : {},
        minRating ? { rating: { gte: minRating } } : {},
        maxRating ? { rating: { lte: maxRating } } : {},
        isSpoiler !== undefined ? { isSpoiler } : {},
      ],
    };

    // Build orderBy clause
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case REVIEWS_CONSTANTS.SORT_OPTIONS.RATING:
        orderBy.rating = sortOrder;
        break;
      case REVIEWS_CONSTANTS.SORT_OPTIONS.UPDATED_AT:
        orderBy.updatedAt = sortOrder;
        break;
      case REVIEWS_CONSTANTS.SORT_OPTIONS.LIKES_COUNT:
        orderBy.likes = { _count: sortOrder };
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
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
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { userId: true },
              }
            : false,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy,
      }),
      this.prisma.review.count({ where }),
    ]);

    const items = reviews.map((review) => this.toReviewResponseDto(review, currentUserId));

    return PaginatedReviewsResponseDto.from(items, page, limit, total);
  }

  async findById(id: string, currentUserId?: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
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
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { userId: true },
            }
          : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user can access this review
    if (!review.isPublished && (!currentUserId || review.userId !== currentUserId)) {
      throw new ForbiddenException('This review is not published');
    }

    return this.toReviewResponseDto(review, currentUserId);
  }

  async findByUserAndGame(userId: string, gameId: string): Promise<ReviewResponseDto | null> {
    const anchorId = await this.toAnchorId(gameId);
    if (!anchorId) return null;

    const review = await this.prisma.review.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: anchorId,
        },
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
    });

    return review ? this.toReviewResponseDto(review) : null;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    currentUserId: string,
  ): Promise<ReviewResponseDto> {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Check ownership
    if (existingReview.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const wasPublished = existingReview.isPublished;
    const willBePublished = updateReviewDto.isPublished ?? existingReview.isPublished;

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const updatedReview = await tx.review.update({
          where: { id },
          data: updateReviewDto,
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
        });

        // Update game rating if publication status changed or rating changed
        if (
          wasPublished !== willBePublished ||
          (willBePublished && updateReviewDto.rating !== undefined)
        ) {
          await this.gamesService.updateRating(existingReview.gameId);
        }

        return updatedReview;
      });

      return this.toReviewResponseDto(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Review not found');
        }
      }
      throw error;
    }
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check ownership
    if (review.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id },
      });

      // Update game rating after deletion if review was published
      if (review.isPublished) {
        await this.gamesService.updateRating(review.gameId);
      }
    });
  }

  async likeReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!review.isPublished) {
      throw new BadRequestException('Cannot like an unpublished review');
    }

    try {
      await this.prisma.like.create({
        data: {
          userId,
          reviewId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('You have already liked this review');
        }
      }
      throw error;
    }
  }

  async unlikeReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const like = await this.prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (!like) {
      throw new BadRequestException('You have not liked this review');
    }

    await this.prisma.like.delete({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });
  }

  async getReviewsByGame(
    gameId: string,
    query: ReviewsQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.findAll({ ...query, gameId }, currentUserId);
  }

  async getReviewsByUser(
    userId: string,
    query: ReviewsQueryDto,
    currentUserId?: string,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.findAll({ ...query, userId }, currentUserId);
  }

    private async toAnchorId(identifier: string): Promise<string | null> {
    const numeric = Number(identifier);
    const isIgdbId = Number.isInteger(numeric) && String(numeric) === identifier;

    const anchor = isIgdbId
      ? await this.prisma.game.findUnique({
          where: { igdbId: numeric },
          select: { id: true },
        })
      : await this.prisma.game.findFirst({
          where: { OR: [{ slug: identifier }, { id: identifier }] },
          select: { id: true },
        });

    return anchor?.id ?? null;
  }

  private toReviewResponseDto(review: any, currentUserId?: string): ReviewResponseDto {
    return {
      id: review.id,
      title: review.title,
      content: review.content,
      rating: review.rating,
      isPublished: review.isPublished,
      isSpoiler: review.isSpoiler,
      user: {
        id: review.user.id,
        username: review.user.username,
        displayName: review.user.displayName,
        avatar: review.user.avatar,
      },
      game: {
        id: review.game.id,
        title: review.game.title,
        slug: review.game.slug,
        coverImage: review.game.coverImage,
      },
      stats: {
        likesCount: review._count.likes,
        commentsCount: review._count.comments,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isLiked: currentUserId ? review.likes?.length > 0 : undefined,
    };
  }
}
