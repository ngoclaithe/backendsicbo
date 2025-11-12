import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaymentService } from './payment.service';
import { UserRole } from '../users/entities/user.entity';
import { DepositStatus } from './entities/deposit.entity';
import { WithdrawalStatus } from './entities/withdrawal.entity';
import {
  CreateDepositDto,
  CreateWithdrawalDto,
  ApproveDepositDto,
  ApproveWithdrawalDto,
  RejectDepositDto,
  RejectWithdrawalDto,
} from './dto/payment.dto';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // ========== PUBLIC INFO (User) ==========
  @Get('infos')
  getAllPaymentInfos(@Request() req) {
    const isAdmin = req.user && req.user.role === UserRole.ADMIN;
    return this.paymentService.getAllPaymentInfos(isAdmin);
  }

  // ========== DEPOSIT (User) ==========
  @Post('deposit/create')
  createDeposit(@Request() req, @Body() dto: CreateDepositDto) {
    return this.paymentService.createDeposit(req.user.userId, dto.paymentInfoId, dto.amount, dto.note);
  }

  @Get('deposit/:id')
  getDepositById(@Param('id') id: string) {
    return this.paymentService.getDepositById(id);
  }

  @Get('deposits/user')
  getMyDeposits(@Request() req) {
    return this.paymentService.getDepositsByUser(req.user.userId);
  }

  // ========== WITHDRAWAL (User) ==========
  @Post('withdrawal/create')
  createWithdrawal(@Request() req, @Body() dto: CreateWithdrawalDto) {
    return this.paymentService.createWithdrawal(
      req.user.userId,
      dto.amount,
      dto.bankName,
      dto.accountNumber,
      dto.accountHolder,
      dto.note,
    );
  }

  @Get('withdrawal/:id')
  getWithdrawalById(@Param('id') id: string) {
    return this.paymentService.getWithdrawalById(id);
  }

  @Get('withdrawals/user')
  getMyWithdrawals(@Request() req) {
    return this.paymentService.getWithdrawalsByUser(req.user.userId);
  }

  // ========== ADMIN ONLY ==========
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('info/create')
  createPaymentInfo(@Body() body: { bankName: string; accountNumber: string; accountHolder: string; description?: string }) {
    return this.paymentService.createInfoPayment(body.bankName, body.accountNumber, body.accountHolder, body.description);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('info/:id')
  updatePaymentInfo(
    @Param('id') id: string,
    @Body() body: { bankName?: string; accountNumber?: string; accountHolder?: string; isActive?: boolean },
  ) {
    return this.paymentService.updateInfoPayment(id, body.bankName, body.accountNumber, body.accountHolder, body.isActive);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('info/:id/activate')
  activatePaymentInfo(@Param('id') id: string) {
    return this.paymentService.activateInfoPayment(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('info/:id/deactivate')
  deactivatePaymentInfo(@Param('id') id: string) {
    return this.paymentService.deactivateInfoPayment(id);
  }

  // ========== ADMIN: GET DEPOSITS WITH FILTER ==========
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deposits')
  getAllDeposits(@Query('status') status?: string) {
    if (status && !Object.values(DepositStatus).includes(status as DepositStatus)) {
      throw new BadRequestException(`Invalid status. Allowed values: ${Object.values(DepositStatus).join(', ')}`);
    }
    
    return this.paymentService.getAllDeposits(status as DepositStatus);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('deposit/:id/approve')
  async approveDeposit(@Param('id') id: string) {
    await this.paymentService.checkAndAutoRejectTimeouts();
    return this.paymentService.approveDeposit(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('deposit/:id/reject')
  rejectDeposit(@Param('id') id: string) {
    return this.paymentService.rejectDeposit(id);
  }

  // ========== ADMIN: GET WITHDRAWALS WITH FILTER ==========
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('withdrawals')
  getAllWithdrawals(@Query('status') status?: string) {
    if (status && !Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)) {
      throw new BadRequestException(`Invalid status. Allowed values: ${Object.values(WithdrawalStatus).join(', ')}`);
    }
    
    return this.paymentService.getAllWithdrawals(status as WithdrawalStatus);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('withdrawal/:id/approve')
  async approveWithdrawal(@Param('id') id: string) {
    await this.paymentService.checkAndAutoRejectTimeouts();
    return this.paymentService.approveWithdrawal(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('withdrawal/:id/reject')
  rejectWithdrawal(@Param('id') id: string) {
    return this.paymentService.rejectWithdrawal(id);
  }
}