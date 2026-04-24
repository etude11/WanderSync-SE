import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SseJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token: string | undefined = req.query?.token;
    if (!token) throw new UnauthorizedException();
    try {
      req.user = this.jwtService.verify(token, {
        secret: this.config.get<string>('auth.jwtSecret'),
      });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
