import { IsString, IsNumber, IsPositive, IsIn } from 'class-validator';

export class PlaceBetDto {
  @IsString()
  @IsIn(['tai', 'xiu'])
  bet: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}