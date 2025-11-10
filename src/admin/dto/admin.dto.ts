import { IsNumber, IsPositive, Min, Max, IsArray, ArrayMinSize, ArrayMaxSize, IsInt } from 'class-validator';

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

export class SetGameResultDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(6, { each: true })
  diceResults: [number, number, number];
}