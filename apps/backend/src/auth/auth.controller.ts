import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard, JwtRefreshGuard } from './guards';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { AuthResponse } from './interfaces';
import { GetUser, Public } from './decorators';
import { max } from 'class-validator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const authResponse = await this.authService.login(loginDto);

    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteOption: 'none' | 'lax' = isProd ? 'none' : 'lax';
    const accessTokenOptions = {
      httpOnly: true,
      // Secure MUST be true if SameSite=None. Use secure in prod only.
      secure: isProd,
      // SameSite=None is required for cross-site cookies (Vercel - Render).
      // In development keep Lax for convenience.
      sameSite: sameSiteOption,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
    const refreshTokenOptions = {
      ...accessTokenOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('authToken', authResponse.accessToken, accessTokenOptions);
    res.cookie('refreshToken', authResponse.refreshToken, refreshTokenOptions);

    return authResponse;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@GetUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.refreshToken(userId);

    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteOption: 'none' | 'lax' = isProd ? 'none' : 'lax';
    const accessTokenOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteOption,
      path: '/',
    };
    const refreshTokenOptions = {
      ...accessTokenOptions,
    };

    res.cookie('authToken', tokens.accessToken, accessTokenOptions);
    res.cookie('refreshToken', tokens.refreshToken, refreshTokenOptions);

    return tokens;
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user and clear auth cookies' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    // Optional: Invalidate tokens server-side (blacklist) here if implemented

    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteOption: 'none' | 'lax' = isProd ? 'none' : 'lax';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteOption,
      path: '/',
      // domain: add if your cookie was set with a specific domain
    };

    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    // No content response
    return;
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password successfully changed' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser() user: any) {
    return user;
  }
}
