import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SimulateDisruptionDto } from './dto/simulate-disruption.dto';
import { DisruptionService } from './disruption.service';

@UseGuards(JwtAuthGuard)
@Controller('disruptions')
export class DisruptionController {
  constructor(private readonly disruptionService: DisruptionService) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.findMine(user.userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.disruptionService.findAll(Number(page), Number(limit));
  }

  @Post('simulate-demo')
  @HttpCode(HttpStatus.CREATED)
  simulateDemo(@CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.simulateDemoDisruption(user.userId);
  }

  @Post('simulate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  simulate(@Body() dto: SimulateDisruptionDto) {
    return this.disruptionService.simulateDisruption(dto);
  }
}
