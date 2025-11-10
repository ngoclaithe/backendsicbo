import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { UpdateGameConfigDto, AdminUpdateBalanceDto, SetGameResultDto } from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Put('game-config')
  updateGameConfig(@Body() updateGameConfigDto: UpdateGameConfigDto) {
    return this.adminService.updateGameConfig(
      updateGameConfigDto.bettingTime,
      updateGameConfigDto.winMultiplier,
    );
  }

  @Post('set-game-result')
  setGameResult(@Body() dto: SetGameResultDto) {
    return this.adminService.setGameResult(dto.diceResults);
  }

  @Get('users')
  getAllUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getAllUsers(Number(page), Number(limit));
  }

  @Get('users/:userId')
  getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Put('users/:userId/toggle-status')
  toggleUserStatus(@Param('userId') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  @Post('users/:userId/adjust-balance')
  adjustUserBalance(
    @Param('userId') userId: string,
    @Body() dto: AdminUpdateBalanceDto,
  ) {
    return this.adminService.adjustUserBalance(userId, dto.amount);
  }

  @Get('statistics')
  getStatistics() {
    return this.adminService.getStatistics();
  }

  @Get('activity')
  getRecentActivity(@Query('limit') limit = 50) {
    return this.adminService.getRecentActivity(Number(limit));
  }
}