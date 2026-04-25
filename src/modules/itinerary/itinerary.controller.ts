import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AddBookingDto } from '../booking/dto/add-booking.dto';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { ItineraryService } from './itinerary.service';

@UseGuards(JwtAuthGuard)
@Controller('itineraries')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  listAll(@CurrentUser() user: AuthenticatedUser) {
    return this.itineraryService.listAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateItineraryDto) {
    return this.itineraryService.create(user.userId, dto);
  }

  @Get(':id')
  findTimeline(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itineraryService.findTimeline(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateItineraryDto,
  ) {
    return this.itineraryService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itineraryService.remove(id, user.userId);
  }

  @Post(':id/bookings')
  addBooking(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddBookingDto,
  ) {
    return this.itineraryService.addBooking(id, user.userId, dto);
  }

  @Delete(':id/bookings/:bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBooking(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.itineraryService.removeBooking(id, bookingId, user.userId);
  }

  @Post(':id/summarize')
  summarize(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.itineraryService.summarize(id, user.userId);
  }
}
