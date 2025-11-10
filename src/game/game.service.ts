import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession, GameStatus } from './entities/game-session.entity';
import { GameHistory } from '../history/entities/game-history.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { User } from '../users/entities/user.entity';

interface BetInfo {
  bet: 'tai' | 'xiu';
  amount: number;
}

interface BettingStats {
  tai: {
    count: number;
    totalAmount: number;
  };
  xiu: {
    count: number;
    totalAmount: number;
  };
}

@Injectable()
export class GameService {
  private currentSession: GameSession;
  private sessionBets: Map<string, BetInfo> = new Map();
  private adminDiceResults: [number, number, number] | null = null;

  constructor(
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private walletService: WalletService,
  ) {}

  async getCurrentSession(): Promise<GameSession> {
    if (!this.currentSession) {
      this.currentSession = await this.createNewSession();
    }
    return this.currentSession;
  }

  async createNewSession(): Promise<GameSession> {
    const session = this.gameSessionRepository.create({
      status: GameStatus.BETTING,
      bettingTime: 45,
      winMultiplier: 1.95,
    });

    this.currentSession = await this.gameSessionRepository.save(session);
    this.sessionBets.clear();
    
    return this.currentSession;
  }

  async placeBet(userId: string, bet: 'tai' | 'xiu', amount: number) {
    const session = await this.getCurrentSession();

    if (session.status !== GameStatus.BETTING) {
      throw new BadRequestException('Betting is closed for this session');
    }

    if (this.sessionBets.has(userId)) {
      throw new BadRequestException('You have already placed a bet for this session');
    }

    await this.walletService.updateBalance(
      userId,
      amount,
      TransactionType.BET,
      `Bet ${bet.toUpperCase()} - Session ${session.id}`,
    );

    this.sessionBets.set(userId, { bet, amount });

    return {
      message: 'Bet placed successfully',
      sessionId: session.id,
      bet,
      amount,
    };
  }

  // Lấy thống kê cược hiện tại
  getBettingStats(): BettingStats {
    const stats: BettingStats = {
      tai: { count: 0, totalAmount: 0 },
      xiu: { count: 0, totalAmount: 0 },
    };

    this.sessionBets.forEach((betInfo) => {
      if (betInfo.bet === 'tai') {
        stats.tai.count++;
        stats.tai.totalAmount += betInfo.amount;
      } else {
        stats.xiu.count++;
        stats.xiu.totalAmount += betInfo.amount;
      }
    });

    return stats;
  }

  // Admin set kết quả trước
  setAdminResult(diceResults: [number, number, number]) {
    this.adminDiceResults = diceResults;
    return {
      message: 'Admin result set successfully',
      diceResults,
    };
  }

  async rollDice(): Promise<GameSession> {
    const session = await this.getCurrentSession();

    if (session.status !== GameStatus.BETTING) {
      throw new BadRequestException('Cannot roll dice at this time');
    }

    session.status = GameStatus.ROLLING;
    await this.gameSessionRepository.save(session);

    let dice1: number, dice2: number, dice3: number;

    // Kiểm tra xem admin có set kết quả trước không
    if (this.adminDiceResults) {
      [dice1, dice2, dice3] = this.adminDiceResults;
      this.adminDiceResults = null; // Reset sau khi sử dụng
    } else {
      // Random như bình thường
      dice1 = Math.floor(Math.random() * 6) + 1;
      dice2 = Math.floor(Math.random() * 6) + 1;
      dice3 = Math.floor(Math.random() * 6) + 1;
    }

    session.diceResults = [dice1, dice2, dice3];
    session.totalPoints = dice1 + dice2 + dice3;
    session.result = session.totalPoints >= 11 ? 'tai' : 'xiu';
    session.status = GameStatus.COMPLETED;
    session.completedAt = new Date();

    await this.gameSessionRepository.save(session);
    await this.processResults(session);

    return session;
  }

  private async processResults(session: GameSession) {
    for (const [userId, betData] of this.sessionBets.entries()) {
      const isWin = betData.bet === session.result;
      const winAmount = isWin ? betData.amount * Number(session.winMultiplier) : 0;

      if (isWin) {
        await this.walletService.updateBalance(
          userId,
          winAmount,
          TransactionType.WIN,
          `Won ${session.result.toUpperCase()} - Session ${session.id}`,
        );
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });

      const history = this.gameHistoryRepository.create({
        user,
        sessionId: session.id,
        diceResults: session.diceResults,
        totalPoints: session.totalPoints,
        result: session.result,
        userBet: betData.bet,
        betAmount: betData.amount,
        winAmount,
        isWin,
      });

      await this.gameHistoryRepository.save(history);
    }
  }

  async getGameHistory(userId: string, limit = 20) {
    return this.gameHistoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getSessionHistory(limit = 20) {
    return this.gameSessionRepository.find({
      where: { status: GameStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}