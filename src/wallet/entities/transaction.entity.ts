import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  BET = 'bet',
  WIN = 'win',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balanceAfter: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Wallet, wallet => wallet.transactions)
  wallet: Wallet;
}
