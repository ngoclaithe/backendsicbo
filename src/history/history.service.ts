import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { GameSession, GameStatus } from '../game/entities/game-session.entity';  // <-- Import GameStatus từ entity
import { User } from '../users/entities/user.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserHistory(userId: string, limit = 50) {
    return this.gameHistoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserStatistics(userId: string) {
    const stats = await this.gameHistoryRepository
      .createQueryBuilder('history')
      .select('COUNT(*)', 'totalGames')
      .addSelect('SUM(CASE WHEN history.isWin THEN 1 ELSE 0 END)', 'wins')
      .addSelect('SUM(history.betAmount)', 'totalBet')
      .addSelect('SUM(history.winAmount)', 'totalWin')
      .where('history.userId = :userId', { userId })
      .getRawOne();

    const totalGames = Number(stats.totalGames) || 0;
    const wins = Number(stats.wins) || 0;

    return {
      totalGames,
      wins,
      losses: totalGames - wins,
      winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0,
      totalBet: Number(stats.totalBet) || 0,
      totalWin: Number(stats.totalWin) || 0,
      netProfit: (Number(stats.totalWin) || 0) - (Number(stats.totalBet) || 0),
    };
  }

  async getGlobalStatistics() {
    const stats = await this.gameHistoryRepository
      .createQueryBuilder('history')
      .select('COUNT(*)', 'totalGames')
      .addSelect('SUM(CASE WHEN result = \'tai\' THEN 1 ELSE 0 END)', 'taiCount')
      .addSelect('SUM(CASE WHEN result = \'xiu\' THEN 1 ELSE 0 END)', 'xiuCount')
      .addSelect('SUM(betAmount)', 'totalBet')
      .addSelect('SUM(winAmount)', 'totalWin')
      .getRawOne();

    return {
      totalGames: Number(stats.totalGames) || 0,
      taiCount: Number(stats.taiCount) || 0,
      xiuCount: Number(stats.xiuCount) || 0,
      totalBet: Number(stats.totalBet) || 0,
      totalWin: Number(stats.totalWin) || 0,
    };
  }

  // 1. Lịch sử 50 phiên gần nhất của từng xúc xắc
  async getDiceHistory(limit = 50) {
    const sessions = await this.gameSessionRepository.find({
      where: { status: GameStatus.COMPLETED },  // <-- Sử dụng enum đã import
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const dice1: number[] = [];
    const dice2: number[] = [];
    const dice3: number[] = [];

    // Đảo ngược để có thứ tự từ cũ đến mới (dễ đọc hơn)
    sessions.reverse().forEach(session => {
      if (session.diceResults && session.diceResults.length === 3) {
        dice1.push(session.diceResults[0]);
        dice2.push(session.diceResults[1]);
        dice3.push(session.diceResults[2]);
      }
    });

    return {
      dice1,
      dice2,
      dice3,
      total: dice1.length,
    };
  }

  // 2. Lịch sử tổng 100 phiên gần nhất (tổng điểm + tài/xỉu)
  async getSessionHistory(limit = 100) {
    const sessions = await this.gameSessionRepository.find({
      where: { status: GameStatus.COMPLETED },  // <-- Sử dụng enum đã import
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return sessions.map(session => ({
      sessionId: session.id,
      totalPoints: session.totalPoints,
      result: session.result,
      diceResults: session.diceResults,
      createdAt: session.createdAt,
    }));
  }

  // 3. Top 10 người chơi thắng lớn nhất trong ngày (giờ VN: UTC+7)
  async getTopWinnersToday(limit = 10) {
    try {
      // Tính thời gian đầu và cuối ngày theo múi giờ Việt Nam (UTC+7)
      const now = new Date();
      const vietnamOffset = 7 * 60; // 7 hours in minutes
      const localOffset = now.getTimezoneOffset(); // offset của server
      const totalOffset = vietnamOffset + localOffset;
      
      // Tạo thời điểm 00:00:00 theo giờ VN
      const startOfDay = new Date(now);
      startOfDay.setMinutes(startOfDay.getMinutes() + totalOffset);
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setMinutes(startOfDay.getMinutes() - totalOffset);
      
      // Tạo thời điểm 23:59:59 theo giờ VN
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('🕐 [Top Winners] Start:', startOfDay.toISOString());
      console.log('🕐 [Top Winners] End:', endOfDay.toISOString());

      // Query top winners trong khoảng thời gian
      const topWinners = await this.gameHistoryRepository
        .createQueryBuilder('history')
        .leftJoinAndSelect('history.user', 'user')
        .select('user.id', 'userId')
        .addSelect('user.username', 'username')
        .addSelect('COUNT(*)', 'totalGames')
        .addSelect('SUM(CASE WHEN history.isWin THEN 1 ELSE 0 END)', 'wins')
        .addSelect('SUM(history.winAmount - history.betAmount)', 'netProfit')  // Lowercase netProfit
        .addSelect('MAX(history.winAmount - history.betAmount)', 'biggestWin')
        .where('history.createdAt >= :startOfDay', { startOfDay })
        .andWhere('history.createdAt <= :endOfDay', { endOfDay })
        .groupBy('user.id')
        .addGroupBy('user.username')
        .orderBy('"netProfit"', 'DESC')  // <-- ĐÃ SỬA: Wrap trong double quotes
        .limit(limit)
        .getRawMany();

      // Trả về mảng rỗng nếu không có dữ liệu
      if (!topWinners || topWinners.length === 0) {
        return [];
      }

      return topWinners.map(winner => ({
        userId: winner.userId,
        username: winner.username,
        totalWin: Number(winner.netProfit) || 0,
        totalGames: Number(winner.totalGames) || 0,
        wins: Number(winner.wins) || 0,
        winRate: Number(winner.totalGames) > 0 
          ? ((Number(winner.wins) / Number(winner.totalGames)) * 100).toFixed(2) 
          : '0.00',
        biggestWin: Number(winner.biggestWin) || 0,
      }));
    } catch (error) {
      console.error('❌ [Top Winners] Error:', error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  }
}