import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards';
import { GetUser, Roles } from '../auth/decorators';
import { PaginatedResponseDto } from '../common/dto';
import { AdminService } from './admin.service';
import {
  AdminStatsDto,
  AdminUserDto,
  AdminUsersQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard counters (Admin only)' })
  @ApiResponse({ status: 200, type: AdminStatsDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users with role and email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findUsers(
    @Query() query: AdminUsersQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserDto>> {
    return this.adminService.findUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a user (Admin only)' })
  @ApiResponse({ status: 201, type: AdminUserDto })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async createUser(@Body() dto: CreateAdminUserDto): Promise<AdminUserDto> {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: AdminUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<AdminUserDto> {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete your own account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string, @GetUser('id') currentUserId: string): Promise<void> {
    return this.adminService.deleteUser(id, currentUserId);
  }
}
