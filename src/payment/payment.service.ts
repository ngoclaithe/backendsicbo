import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InfoPayment } from './entities/info-payment.entity';
import { Deposit, DepositStatus } from './entities/deposit.entity';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType } from '../wallet/entities/transaction.entity';

function generateCodepay(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(InfoPayment)
    private infoPaymentRepository: Repository<InfoPayment>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  // ========== INFO PAYMENT (Admin only) ==========
  async createInfoPayment(bankName: string, accountNumber: string, accountHolder: string, description?: string) {
    const infoPayment = this.infoPaymentRepository.create({
      bankName,
      accountNumber,
      accountHolder,
      description,
    });
    return this.infoPaymentRepository.save(infoPayment);
  }

  async getAllPaymentInfos(isAdmin = false) {
    if (isAdmin) {
      return this.infoPaymentRepository.find();
    }

    return this.infoPaymentRepository.find({ where: { isActive: true } });
  }

  async updateInfoPayment(id: string, bankName?: string, accountNumber?: string, accountHolder?: string, isActive?: boolean) {
    const infoPayment = await this.infoPaymentRepository.findOne({ where: { id } });
    if (!infoPayment) {
      throw new NotFoundException('Payment info not found');
    }

    if (bankName) infoPayment.bankName = bankName;
    if (accountNumber) infoPayment.accountNumber = accountNumber;
    if (accountHolder) infoPayment.accountHolder = accountHolder;
    if (isActive !== undefined) infoPayment.isActive = isActive;

    return this.infoPaymentRepository.save(infoPayment);
  }

  // Activate a payment info (admin)
  async activateInfoPayment(id: string) {
    const infoPayment = await this.infoPaymentRepository.findOne({ where: { id } });
    if (!infoPayment) {
      throw new NotFoundException('Payment info not found');
    }

    if (infoPayment.isActive) {
      return infoPayment; 
    }

    infoPayment.isActive = true;
    return this.infoPaymentRepository.save(infoPayment);
  }

  // Deactivate a payment info (admin)
  async deactivateInfoPayment(id: string) {
    const infoPayment = await this.infoPaymentRepository.findOne({ where: { id } });
    if (!infoPayment) {
      throw new NotFoundException('Payment info not found');
    }

    if (!infoPayment.isActive) {
      return infoPayment; 
    }

    infoPayment.isActive = false;
    return this.infoPaymentRepository.save(infoPayment);
  }

  // ========== DEPOSIT ==========
  async createDeposit(userId: string, paymentInfoId: string, amount: number, note?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paymentInfo = await this.infoPaymentRepository.findOne({ where: { id: paymentInfoId } });
    if (!paymentInfo) {
      throw new NotFoundException('Payment info not found');
    }

    const codepay = generateCodepay();

    const deposit = this.depositRepository.create({
      codepay,
      user,
      paymentInfo,
      amount,
      note,
      status: DepositStatus.PENDING,
    });

    return this.depositRepository.save(deposit);
  }

  async approveDeposit(depositId: string) {
    const deposit = await this.depositRepository.findOne({
      where: { id: depositId },
      relations: ['user', 'paymentInfo'],
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException(`Deposit is already ${deposit.status}`);
    }

    await this.walletService.updateBalance(
      deposit.user.id,
      deposit.amount,
      TransactionType.DEPOSIT,
      `Deposit approved - CODEPAY: ${deposit.codepay}`,
    );

    deposit.status = DepositStatus.SUCCESS;
    deposit.approvedAt = new Date();

    return this.depositRepository.save(deposit);
  }

  async rejectDeposit(depositId: string) {
    const deposit = await this.depositRepository.findOne({ where: { id: depositId } });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException(`Deposit is already ${deposit.status}`);
    }

    deposit.status = DepositStatus.FAILED;
    deposit.updatedAt = new Date();

    return this.depositRepository.save(deposit);
  }

  async getDepositById(depositId: string) {
    return this.depositRepository.findOne({
      where: { id: depositId },
      relations: ['user', 'paymentInfo'],
    });
  }

  async getDepositsByUser(userId: string) {
    return this.depositRepository.find({
      where: { user: { id: userId } },
      relations: ['paymentInfo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllDeposits(status?: DepositStatus) {
    const whereCondition = status ? { status } : {};
    
    return this.depositRepository.find({
      where: whereCondition,
      relations: ['user', 'paymentInfo'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========== WITHDRAWAL ==========
  async createWithdrawal(userId: string, amount: number, bankName: string, accountNumber: string, accountHolder: string, note?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletService.getWallet(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const codepay = generateCodepay();

    const withdrawal = this.withdrawalRepository.create({
      codepay,
      user,
      amount,
      bankName,
      accountNumber,
      accountHolder,
      note,
      status: WithdrawalStatus.PENDING,
    });

    return this.withdrawalRepository.save(withdrawal);
  }

  async approveWithdrawal(withdrawalId: string) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
      relations: ['user'],
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(`Withdrawal is already ${withdrawal.status}`);
    }

    await this.walletService.updateBalance(
      withdrawal.user.id,
      withdrawal.amount,
      TransactionType.WITHDRAW,
      `Withdrawal approved - CODEPAY: ${withdrawal.codepay}`,
    );

    withdrawal.status = WithdrawalStatus.SUCCESS;
    withdrawal.approvedAt = new Date();

    return this.withdrawalRepository.save(withdrawal);
  }

  async rejectWithdrawal(withdrawalId: string) {
    const withdrawal = await this.withdrawalRepository.findOne({ where: { id: withdrawalId } });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(`Withdrawal is already ${withdrawal.status}`);
    }

    withdrawal.status = WithdrawalStatus.FAILED;
    withdrawal.updatedAt = new Date();

    return this.withdrawalRepository.save(withdrawal);
  }

  async getWithdrawalById(withdrawalId: string) {
    return this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
      relations: ['user'],
    });
  }

  async getWithdrawalsByUser(userId: string) {
    return this.withdrawalRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllWithdrawals(status?: WithdrawalStatus) {
    const whereCondition = status ? { status } : {};
    
    return this.withdrawalRepository.find({
      where: whereCondition,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========== AUTO TIMEOUT LOGIC ==========
  async checkAndAutoRejectTimeouts() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Check deposits
    const expiredDeposits = await this.depositRepository.find({
      where: { status: DepositStatus.PENDING },
    });

    for (const deposit of expiredDeposits) {
      if (deposit.createdAt < thirtyMinutesAgo) {
        console.log(`Auto-rejecting deposit ${deposit.id} due to 30-min timeout`);
        deposit.status = DepositStatus.FAILED;
        await this.depositRepository.save(deposit);
      }
    }

    // Check withdrawals
    const expiredWithdrawals = await this.withdrawalRepository.find({
      where: { status: WithdrawalStatus.PENDING },
    });

    for (const withdrawal of expiredWithdrawals) {
      if (withdrawal.createdAt < thirtyMinutesAgo) {
        console.log(`Auto-rejecting withdrawal ${withdrawal.id} due to 30-min timeout`);
        withdrawal.status = WithdrawalStatus.FAILED;
        await this.withdrawalRepository.save(withdrawal);
      }
    }
  }
}