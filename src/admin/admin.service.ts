import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession, GameStatus } from '../game/entities/game-session.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { GameHistory } from '../history/entities/game-history.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    private walletService: WalletService,
  ) {}

  async updateGameConfig(bettingTime?: number, winMultiplier?: number) {
    const latestSession = await this.gameSessionRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (latestSession) {
      if (bettingTime !== undefined) {
        latestSession.bettingTime = bettingTime;
      }
      if (winMultiplier !== undefined) {
        latestSession.winMultiplier = winMultiplier;
      }
      await this.gameSessionRepository.save(latestSession);
    }

    return {
      message: 'Game configuration updated successfully',
      bettingTime: latestSession?.bettingTime,
      winMultiplier: latestSession?.winMultiplier,
    };
  }

  async getAllUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['wallet'],
    });

    return {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        balance: user.wallet?.balance || 0,
        createdAt: user.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      userId: user.id,
      isActive: user.isActive,
    };
  }

  async adjustUserBalance(userId: string, amount: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const type = amount > 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAW;
    const absAmount = Math.abs(amount);

    await this.walletService.updateBalance(
      userId,
      absAmount,
      type,
      `Admin adjustment: ${amount > 0 ? '+' : '-'}${absAmount}`,
    );

    const wallet = await this.walletService.getWallet(userId);

    return {
      message: 'Balance adjusted successfully',
      userId,
      newBalance: wallet.balance,
    };
  }

  async getStatistics() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    
    const totalSessions = await this.gameSessionRepository.count();
    const completedSessions = await this.gameSessionRepository.count({
      where: { status: GameStatus.COMPLETED },
    });

    const totalBets = await this.gameHistoryRepository.count();
    
    const betsSum = await this.gameHistoryRepository
      .createQueryBuilder('history')
      .select('SUM(history.betAmount)', 'total')
      .getRawOne();

    const winsSum = await this.gameHistoryRepository
      .createQueryBuilder('history')
      .select('SUM(history.winAmount)', 'total')
      .getRawOne();

    const totalWalletBalance = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      games: {
        totalSessions,
        completedSessions,
        totalBets,
      },
      finance: {
        totalBetsAmount: Number(betsSum.total) || 0,
        totalWinAmount: Number(winsSum.total) || 0,
        profit: (Number(betsSum.total) || 0) - (Number(winsSum.total) || 0),
        totalWalletBalance: Number(totalWalletBalance.total) || 0,
      },
    };
  }

  async getRecentActivity(limit = 50) {
    const recentGames = await this.gameHistoryRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return recentGames.map(game => ({
      id: game.id,
      username: game.user.username,
      sessionId: game.sessionId,
      bet: game.userBet,
      betAmount: game.betAmount,
      result: game.result,
      isWin: game.isWin,
      winAmount: game.winAmount,
      createdAt: game.createdAt,
    }));
  }

  async getUserDetail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const gameHistory = await this.gameHistoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const transactions = await this.walletService.getTransactions(userId, 20);

    const stats = await this.gameHistoryRepository
      .createQueryBuilder('history')
      .select('COUNT(*)', 'totalGames')
      .addSelect('SUM(CASE WHEN history.isWin THEN 1 ELSE 0 END)', 'wins')
      .addSelect('SUM(history.betAmount)', 'totalBet')
      .addSelect('SUM(history.winAmount)', 'totalWin')
      .where('history.userId = :userId', { userId })
      .getRawOne();

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        balance: user.wallet?.balance || 0,
        createdAt: user.createdAt,
      },
      statistics: {
        totalGames: Number(stats.totalGames) || 0,
        wins: Number(stats.wins) || 0,
        losses: (Number(stats.totalGames) || 0) - (Number(stats.wins) || 0),
        winRate: Number(stats.totalGames) > 0 
          ? ((Number(stats.wins) / Number(stats.totalGames)) * 100).toFixed(2) 
          : 0,
        totalBet: Number(stats.totalBet) || 0,
        totalWin: Number(stats.totalWin) || 0,
        netProfit: (Number(stats.totalWin) || 0) - (Number(stats.totalBet) || 0),
      },
      recentGames: gameHistory,
      recentTransactions: transactions,
    };
  }
}