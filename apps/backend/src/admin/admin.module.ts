import { Module } from '@nestjs/common';
import { GamesModule } from '../games/games.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [GamesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
