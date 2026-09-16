import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GamesService } from './games.service';
import {
  GameDetailDto,
  GameFilterOptionsDto,
  GameResponseDto,
  PaginatedGamesResponseDto,
  GamesQueryDto,
} from './dto';
import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all games with filters and pagination (sourced from IGDB)' })
  @ApiResponse({ status: 200, description: 'Games retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'genreIds', required: false, type: [Number] })
  @ApiQuery({ name: 'platformIds', required: false, type: [Number] })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(@Query() query: GamesQueryDto): Promise<PaginatedGamesResponseDto> {
    return this.gamesService.findAll(query);
  }

  // Keep above ':slug'.
  @Get('filters')
  @Public()
  @ApiOperation({ summary: 'Get the IGDB genre and platform options for the filter UI' })
  @ApiResponse({
    status: 200,
    description: 'Filter options retrieved successfully',
    type: GameFilterOptionsDto,
  })
  async getFilterOptions(): Promise<GameFilterOptionsDto> {
    return this.gamesService.getFilterOptions();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get game details by slug' })
  @ApiParam({ name: 'slug', description: 'Game slug' })
  @ApiResponse({
    status: 200,
    description: 'Game details retrieved successfully',
    type: GameDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async findBySlug(@Param('slug') slug: string): Promise<GameDetailDto> {
    return this.gamesService.findBySlug(slug);
  }

  @Get(':id/similar')
  @Public()
  @ApiOperation({ summary: 'Get similar games' })
  @ApiParam({ name: 'id', description: 'Game ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of similar games to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Similar games retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getSimilarGames(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<GameResponseDto[]> {
    return this.gamesService.getSimilarGames(id, limit);
  }
}
