import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { PlaceBetDto } from './dto/game.dto';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Get('current-session')
  getCurrentSession() {
    return this.gameService.getCurrentSession();
  }

  @Get('history')
  getGameHistory(@Request() req) {
    return this.gameService.getGameHistory(req.user.userId);
  }

  @Get('sessions')
  getSessionHistory() {
    return this.gameService.getSessionHistory();
  }
}