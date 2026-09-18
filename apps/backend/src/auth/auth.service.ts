import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '@/users/users.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtPayload, AuthResponse } from './interfaces';
import {
  BCRYPT_SALT_ROUNDS,
  BCRYPT_RESET_TOKEN_ROUNDS,
  JWT_TOKEN_TYPE,
  AUTH_MESSAGES,
} from './constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password } = registerDto;

    const existingUser = await this.usersService.findByEmailOrUsername(email, username);
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_REGISTERED);
      }
      if (existingUser.username === username) {
        throw new ConflictException(AUTH_MESSAGES.USERNAME_ALREADY_TAKEN);
      }
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(AUTH_MESSAGES.CURRENT_PASSWORD_INCORRECT);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.updatePassword(userId, hashedNewPassword);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    const resetToken = this.jwtService.sign(
      { userId: user.id, type: JWT_TOKEN_TYPE.RESET },
      {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
        expiresIn: '1h',
      },
    );

    const resetTokenHash = await bcrypt.hash(resetToken, BCRYPT_RESET_TOKEN_ROUNDS);
    await this.usersService.updateResetToken(user.id, resetTokenHash);

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      }) as { userId: string; type: string };

      if (decoded.type !== JWT_TOKEN_TYPE.RESET) {
        throw new BadRequestException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
      }

      const user = await this.usersService.findById(decoded.userId);
      if (!user || !user.resetToken) {
        throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }

      const isTokenValid = await bcrypt.compare(token, user.resetToken);
      if (!isTokenValid) {
        throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await this.usersService.updatePassword(user.id, hashedPassword);
      await this.usersService.clearResetToken(user.id);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
