import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserHistory(@Request() req, @Query('limit') limit = 50) {
    return this.historyService.getUserHistory(req.user.userId, Number(limit));
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  getUserStatistics(@Request() req) {
    return this.historyService.getUserStatistics(req.user.userId);
  }

  @Get('global')
  getGlobalStatistics() {
    return this.historyService.getGlobalStatistics();
  }

  // Endpoint 1: Lịch sử 50 phiên gần nhất của từng xúc xắc
  @Get('dice')
  getDiceHistory(@Query('limit') limit = 50) {
    return this.historyService.getDiceHistory(Number(limit));
  }

  // Endpoint 2: Lịch sử tổng 100 phiên gần nhất
  @Get('sessions')
  getSessionHistory(@Query('limit') limit = 100) {
    return this.historyService.getSessionHistory(Number(limit));
  }

  // Endpoint 3: Top 10 người chơi thắng lớn nhất trong ngày
  @Get('top-winners-today')
  getTopWinnersToday(@Query('limit') limit = 10) {
    return this.historyService.getTopWinnersToday(Number(limit));
  }
}
