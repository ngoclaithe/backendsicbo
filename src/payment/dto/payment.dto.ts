import { IsNumber, IsPositive, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDepositDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsUUID()
  paymentInfoId: string; // ID của infoPayment

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateWithdrawalDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountHolder: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ApproveDepositDto {
  @IsUUID()
  depositId: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ApproveWithdrawalDto {
  @IsUUID()
  withdrawalId: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class RejectDepositDto {
  @IsUUID()
  depositId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RejectWithdrawalDto {
  @IsUUID()
  withdrawalId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
