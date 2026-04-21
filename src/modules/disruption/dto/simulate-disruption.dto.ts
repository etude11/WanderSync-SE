import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, Max, MinLength } from 'class-validator';
import { DisruptionType } from '@prisma/client';

export class SimulateDisruptionDto {
  @IsEnum(DisruptionType)
  type!: DisruptionType;

  @IsInt()
  @Min(1)
  @Max(4)
  severity!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  flightIata?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  affectedOrigin?: string;
}
