import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { GameSession } from '../game/entities/game-session.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { GameHistory } from '../history/entities/game-history.entity';
import { WalletModule } from '../wallet/wallet.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameSession, User, Wallet, GameHistory]),
    WalletModule,
    GameModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}