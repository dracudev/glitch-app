import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { CompaniesController } from './companies.controller';
import { GamesService } from './games.service';
import { IgdbModule } from '@/igdb/igdb.module';

@Module({
  imports: [IgdbModule],
  controllers: [GamesController, CompaniesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
