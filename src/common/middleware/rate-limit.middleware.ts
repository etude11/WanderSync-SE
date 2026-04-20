import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, Response } from "express";
import { RedisService } from "../../database/redis.service";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = this.resolveIp(req);
      const key = `ratelimit:${ip}`;
      const maxRequests =
        this.configService.get<number>("app.rateLimitPerMinute") ?? 60;

      const currentCount = await this.redisService.client.incr(key);
      if (currentCount === 1) {
        await this.redisService.client.expire(key, 60);
      }

      if (currentCount > maxRequests) {
        throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  }

  private resolveIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }

    return req.ip || "unknown";
  }
}
