import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('game_history')
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({ type: 'int', array: true })
  diceResults: number[];

  @Column()
  totalPoints: number;

  @Column()
  result: string; // 'tai' | 'xiu'

  @Column({ nullable: true })
  evenOddResult: string; // 'chan' | 'le'

  @Column()
  userBet: string; // 'tai' | 'xiu' | 'chan' | 'le'

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  betAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  winAmount: number;

  @Column()
  isWin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.gameHistory)
  user: User;
}