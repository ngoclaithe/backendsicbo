import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codepay: string;

  @Column({ type: 'varchar', default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column()
  accountHolder: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;
}
