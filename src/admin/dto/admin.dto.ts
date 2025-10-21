import { IsNumber, IsPositive, Min, Max } from 'class-validator';

export class UpdateGameConfigDto {
  @IsNumber()
  @Min(10)
  @Max(120)
  bettingTime?: number;

  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(10)
  winMultiplier?: number;
}

export class AdminUpdateBalanceDto {
  @IsNumber()
  amount: number;
}