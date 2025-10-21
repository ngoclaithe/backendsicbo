import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { GameHistory } from './entities/game-history.entity';
import { GameSession } from '../game/entities/game-session.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, GameSession, User]),
    AuthModule,
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}