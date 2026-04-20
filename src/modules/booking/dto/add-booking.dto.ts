import { IsDateString, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { BookingType } from '@prisma/client';

export class AddBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  providerRef!: string;

  @IsEnum(BookingType)
  type!: BookingType;

  @IsDateString()
  departureTime!: string;

  @IsDateString()
  arrivalTime!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  origin!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  destination!: string;
}
