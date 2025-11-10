import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('info_payments')
export class InfoPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankName: string; // Tên ngân hàng (VCB, ACB, ...)

  @Column()
  accountNumber: string; // Số tài khoản

  @Column()
  accountHolder: string; // Tên chủ tài khoản

  @Column({ type: 'text', nullable: true })
  description: string; // Mô tả/ghi chú

  @Column({ default: true })
  isActive: boolean; // Có hoạt động hay không

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
