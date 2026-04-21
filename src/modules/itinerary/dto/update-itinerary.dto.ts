import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateItineraryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;
}
