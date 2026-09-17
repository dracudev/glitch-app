import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { SocialModule } from '@/social/social.module';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { JwtAuthGuard } from '@/auth/guards';
import { GamesModule } from '@/games/games.module';
import { AdminModule } from '@/admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    DatabaseModule,
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    GamesModule,
    ReviewsModule,
    SocialModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
