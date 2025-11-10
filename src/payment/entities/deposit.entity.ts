import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InfoPayment } from './info-payment.entity';

export enum DepositStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codepay: string; // Mã CODEPAY 6 ký tự (ví dụ: ABC123)

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => InfoPayment)
  paymentInfo: InfoPayment; // Tài khoản nạp tiền đến

  @Column({ nullable: true })
  note: string; // Ghi chú từ user (ví dụ ghi CODEPAY vào nội dung chuyển khoản)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date; // Thời gian admin duyệt
}
