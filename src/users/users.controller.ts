import { Controller, Get, Put, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Lấy tất cả users (Admin only) - có phân trang
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  getAllUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.usersService.getAllUsers(page, limit);
  }

  // Lấy thông tin user theo ID (Admin only)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // Tìm user theo username (Admin only)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/search/by-username')
  getUserByUsername(@Query('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  // Khóa user (Admin only)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/:id/lock')
  lockUser(@Param('id') id: string) {
    return this.usersService.lockUser(id);
  }

  // Mở khóa user (Admin only)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/:id/unlock')
  unlockUser(@Param('id') id: string) {
    return this.usersService.unlockUser(id);
  }

  // Toggle trạng thái khóa/mở user (Admin only)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/:id/toggle-status')
  toggleUserStatus(@Param('id') id: string) {
    return this.usersService.toggleUserStatus(id);
  }
}
