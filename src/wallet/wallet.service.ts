import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async updateBalance(
    userId: string,
    amount: number,
    type: TransactionType,
    description?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      let balanceAfter: number;

      if (type === TransactionType.DEPOSIT || type === TransactionType.WIN) {
        balanceAfter = balanceBefore + amount;
      } else if (type === TransactionType.WITHDRAW || type === TransactionType.BET) {
        if (balanceBefore < amount) {
          throw new BadRequestException('Insufficient balance');
        }
        balanceAfter = balanceBefore - amount;
      }

      wallet.balance = balanceAfter;
      await manager.save(wallet);

      const transaction = manager.create(Transaction, {
        wallet,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
      });

      await manager.save(transaction);

      return { wallet, transaction };
    });
  }

  async getTransactions(userId: string, limit = 50) {
    const wallet = await this.getWallet(userId);
    
    return this.transactionRepository.find({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
