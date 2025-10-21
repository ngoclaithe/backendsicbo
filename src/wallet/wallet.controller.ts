import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Get('transactions')
  getTransactions(@Request() req) {
    return this.walletService.getTransactions(req.user.userId);
  }
}
