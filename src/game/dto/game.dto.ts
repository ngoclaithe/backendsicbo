import { IsString, IsNumber, IsPositive, IsIn } from 'class-validator';

export class PlaceBetDto {
  @IsString()
  @IsIn(['tai', 'xiu', 'chan', 'le'])
  bet: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}