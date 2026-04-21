import { Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

const NOT_IMPLEMENTED = 'Social synchronisation not implemented in prototype scope';

@Public()
@Controller('social')
export class SocialController {
  @Get()
  getConnections(): never {
    throw new HttpException(NOT_IMPLEMENTED, HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('sync')
  syncItinerary(): never {
    throw new HttpException(NOT_IMPLEMENTED, HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('status')
  getStatus(): never {
    throw new HttpException(NOT_IMPLEMENTED, HttpStatus.NOT_IMPLEMENTED);
  }
}
