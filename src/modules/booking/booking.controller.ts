import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BookingService } from './booking.service';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('aggregate')
  aggregate(
    @Query('itineraryId') itineraryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.aggregate(itineraryId, user.userId);
  }

  @Get('lookup/flight')
  lookupFlight(@Query('ref') ref: string) {
    return this.bookingService.lookupFlight(ref);
  }

  @Get('lookup/hotel')
  lookupHotel(
    @Query('city') city: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.bookingService.lookupHotel(city, checkIn, checkOut);
  }

  @Get('lookup/transport')
  lookupTransport(
    @Query('type') type: string,
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.bookingService.lookupTransport(type, origin, destination);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findOne(id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.remove(id, user.userId);
  }
}
