import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Query,
  Req,
  Sse,
  MessageEvent,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtQueryGuard } from './guards/jwt-query.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SimulateDisruptionDto } from './dto/simulate-disruption.dto';
import { DisruptionService } from './disruption.service';
import { DisruptionStreamService } from './disruption-stream.service';

@UseGuards(JwtAuthGuard)
@Controller('disruptions')
export class DisruptionController {
  constructor(
    private readonly disruptionService: DisruptionService,
    private readonly disruptionStreamService: DisruptionStreamService,
  ) {}

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.findMine(user.userId);
  }

  @Sse('stream')
  @Public()
  @UseGuards(JwtQueryGuard)
  async stream(@Query('token') token: string, @Req() req: any): Promise<Observable<MessageEvent>> {
    const userId = req.user.userId;
    return await this.disruptionStreamService.streamForUser(userId);
  }

  @Post(':id/ack')
  @HttpCode(HttpStatus.OK)
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.acknowledge(id, user.userId);
  }

  @Get(':id/suggestions')
  getSuggestions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.getSuggestions(id, user.userId);
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
