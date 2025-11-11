import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession, GameStatus } from './entities/game-session.entity';
import { GameHistory } from '../history/entities/game-history.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { User } from '../users/entities/user.entity';

interface BetInfo {
  bet: 'tai' | 'xiu' | 'chan' | 'le';
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
  chan: {
    count: number;
    totalAmount: number;
  };
  le: {
    count: number;
    totalAmount: number;
  };
}

@Injectable()
export class GameService {
  private currentSession: GameSession;
  private sessionBets: Map<string, BetInfo[]> = new Map();
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

  async placeBet(userId: string, bet: 'tai' | 'xiu' | 'chan' | 'le', amount: number) {
    const session = await this.getCurrentSession();

    if (session.status !== GameStatus.BETTING) {
      throw new BadRequestException('Betting is closed for this session');
    }

    const userBets = this.sessionBets.get(userId) || [];

    const hasOpposite = userBets.some((b) =>
      (bet === 'tai' && b.bet === 'xiu') ||
      (bet === 'xiu' && b.bet === 'tai') ||
      (bet === 'chan' && b.bet === 'le') ||
      (bet === 'le' && b.bet === 'chan')
    );

    if (hasOpposite) {
      throw new BadRequestException('Cannot bet on opposite options in the same session');
    }

    const wallet = await this.walletService.getWallet(userId);
    console.log(`DEBUG BET: userId=${userId}, walletBalance=${wallet.balance}, amount=${amount}`);
    if (amount > Number(wallet.balance)) {
      throw new BadRequestException('Không đủ số dư');
    }

    await this.walletService.updateBalance(
      userId,
      amount,
      TransactionType.BET,
      `Bet ${bet.toUpperCase()} - Session ${session.id}`,
    );

    userBets.push({ bet, amount });
    this.sessionBets.set(userId, userBets);

    return {
      message: 'Bet placed successfully',
      sessionId: session.id,
      bet,
      amount,
    };
  }

  getBettingStats(): BettingStats {
    const stats: BettingStats = {
      tai: { count: 0, totalAmount: 0 },
      xiu: { count: 0, totalAmount: 0 },
      chan: { count: 0, totalAmount: 0 },
      le: { count: 0, totalAmount: 0 },
    };

    this.sessionBets.forEach((betsArray) => {
      let countedTai = false;
      let countedXiu = false;
      let countedChan = false;
      let countedLe = false;

      for (const betInfo of betsArray) {
        if (betInfo.bet === 'tai') {
          stats.tai.totalAmount += betInfo.amount;
          if (!countedTai) {
            stats.tai.count++;
            countedTai = true;
          }
        } else if (betInfo.bet === 'xiu') {
          stats.xiu.totalAmount += betInfo.amount;
          if (!countedXiu) {
            stats.xiu.count++;
            countedXiu = true;
          }
        } else if (betInfo.bet === 'chan') {
          stats.chan.totalAmount += betInfo.amount;
          if (!countedChan) {
            stats.chan.count++;
            countedChan = true;
          }
        } else {
          stats.le.totalAmount += betInfo.amount;
          if (!countedLe) {
            stats.le.count++;
            countedLe = true;
          }
        }
      }
    });

    return stats;
  }

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

    if (this.adminDiceResults) {
      [dice1, dice2, dice3] = this.adminDiceResults;
      this.adminDiceResults = null;
    } else {
      dice1 = Math.floor(Math.random() * 6) + 1;
      dice2 = Math.floor(Math.random() * 6) + 1;
      dice3 = Math.floor(Math.random() * 6) + 1;
    }

    session.diceResults = [dice1, dice2, dice3];
    session.totalPoints = dice1 + dice2 + dice3;
    session.result = session.totalPoints >= 11 ? 'tai' : 'xiu';
    session.evenOddResult = session.totalPoints % 2 === 0 ? 'chan' : 'le';
    session.status = GameStatus.COMPLETED;
    session.completedAt = new Date();

    await this.gameSessionRepository.save(session);
    await this.processResults(session);

    return session;
  }

  private async processResults(session: GameSession) {
    for (const [userId, betsArray] of this.sessionBets.entries()) {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      for (const betData of betsArray) {
        const isWin = (betData.bet === session.result) || (betData.bet === session.evenOddResult);
        const winAmount = isWin ? betData.amount * Number(session.winMultiplier) : 0;

        if (isWin) {
          const resultType = ['tai', 'xiu'].includes(betData.bet) ? session.result : session.evenOddResult;
          await this.walletService.updateBalance(
            userId,
            winAmount,
            TransactionType.WIN,
            `Won ${resultType.toUpperCase()} - Session ${session.id}`,
          );
        }

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
          evenOddResult: session.evenOddResult,
        });

        await this.gameHistoryRepository.save(history);
      }
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