import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
  ReviewsQueryDto,
  DeleteSuccessResponseDto,
} from './dto';
import { JwtAuthGuard } from '@/auth/guards';
import { GetUser, OptionalAuth } from '@/auth/decorators';
import { User } from '@prisma/client';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or game already reviewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(createReviewDto, user.id);
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({ summary: 'Get all reviews with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: PaginatedReviewsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'gameId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'isSpoiler', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(
    @Query() query: ReviewsQueryDto,
    @GetUser() user?: User,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.findAll(query, user?.id);
  }

  @Get(':id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review retrieved successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Review is not published' })
  async findById(@Param('id') id: string, @GetUser() user?: User): Promise<ReviewResponseDto> {
    return this.reviewsService.findById(id, user?.id);
  }

  @Get('game/:gameId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get reviews for a specific game' })
  @ApiParam({ name: 'gameId', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Game reviews retrieved successfully',
    type: PaginatedReviewsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getReviewsByGame(
    @Param('gameId') gameId: string,
    @Query() query: ReviewsQueryDto,
    @GetUser() user?: User,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.getReviewsByGame(gameId, query, user?.id);
  }

  @Get('user/:userId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get reviews by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User reviews retrieved successfully',
    type: PaginatedReviewsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'gameId', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async getReviewsByUser(
    @Param('userId') userId: string,
    @Query() query: ReviewsQueryDto,
    @GetUser() user?: User,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.getReviewsByUser(userId, query, user?.id);
  }

  @Get('user/:userId/game/:gameId')
  @OptionalAuth()
  @ApiOperation({ summary: "Get a specific user's review for a specific game" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'gameId', description: 'Game ID' })
  @ApiResponse({
    status: 200,
    description: 'Review retrieved successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReviewByUserAndGame(
    @Param('userId') userId: string,
    @Param('gameId') gameId: string,
  ): Promise<ReviewResponseDto | null> {
    return this.reviewsService.findByUserAndGame(userId, gameId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review (owner only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not review owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser() user: User,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.update(id, updateReviewDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (owner only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 204,
    description: 'Review deleted successfully',
    type: DeleteSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not review owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.reviewsService.remove(id, user.id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 201, description: 'Review liked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Already liked or review not published' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async likeReview(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.reviewsService.likeReview(id, user.id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'Review unliked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Not liked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async unlikeReview(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.reviewsService.unlikeReview(id, user.id);
  }
}
