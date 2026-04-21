import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateItineraryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;
}
