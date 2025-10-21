import { IsNumber, IsPositive, IsEnum } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class UpdateBalanceDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;
}