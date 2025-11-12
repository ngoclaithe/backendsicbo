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
  codepay: string; 

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => InfoPayment)
  paymentInfo: InfoPayment; 

  @Column({ nullable: true })
  note: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date; 
}
