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
  codepay: string; // Mã CODEPAY 6 ký tự

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  bankName: string; // Tên ngân hàng rút tiền đến

  @Column()
  accountNumber: string; // Số tài khoản rút tiền đến

  @Column()
  accountHolder: string; // Tên chủ tài khoản

  @Column({ nullable: true })
  note: string; // Ghi chú

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date; // Thời gian admin duyệt
}
