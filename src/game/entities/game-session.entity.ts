import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum GameStatus {
  BETTING = 'betting',
  ROLLING = 'rolling',
  COMPLETED = 'completed',
}

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.BETTING })
  status: GameStatus;

  @Column({ type: 'int', array: true, nullable: true })
  diceResults: number[];

  @Column({ nullable: true })
  totalPoints: number;

  @Column({ nullable: true })
  result: string; // 'tai' | 'xiu'

  @Column({ type: 'int', default: 30 })
  bettingTime: number; // seconds

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.95 })
  winMultiplier: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}