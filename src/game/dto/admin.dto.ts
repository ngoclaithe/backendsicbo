import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max } from 'class-validator';

export class SetGameResultDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(6, { each: true })
  diceResults: [number, number, number];
}