import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CompanyDetailDto } from './dto';
import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get an IGDB company (developer or publisher) by slug' })
  @ApiParam({ name: 'slug', description: 'Company slug' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully', type: CompanyDetailDto })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findBySlug(@Param('slug') slug: string): Promise<CompanyDetailDto> {
    return this.gamesService.getCompany(slug);
  }
}
