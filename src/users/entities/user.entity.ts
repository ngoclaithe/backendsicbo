import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { GameHistory } from '../../history/entities/game-history.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Wallet, wallet => wallet.user)
  wallet: Wallet;

  @OneToMany(() => GameHistory, history => history.user)
  gameHistory: GameHistory[];
}
