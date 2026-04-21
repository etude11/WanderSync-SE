import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationLog } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

type StreamMessage = [string, string[]];
type StreamEntry = [string, StreamMessage[]];
type XReadGroupResult = StreamEntry[] | null;

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private static readonly STREAM_KEY = 'disruption-events';
  private static readonly GROUP = 'notification';
  private static readonly CONSUMER = 'notification-worker-1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.client.xgroup(
        'CREATE',
        NotificationService.STREAM_KEY,
        NotificationService.GROUP,
        '$',
        'MKSTREAM',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('BUSYGROUP')) throw err;
      this.logger.log('Consumer group already exists, continuing');
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async consumeStream(): Promise<void> {
    const results = (await (this.redis.client as unknown as {
      xreadgroup: (...args: (string | number)[]) => Promise<XReadGroupResult>;
    }).xreadgroup(
      'GROUP', NotificationService.GROUP, NotificationService.CONSUMER,
      'COUNT', 10,
      'STREAMS', NotificationService.STREAM_KEY, '>',
    )) as XReadGroupResult;

    if (!results) return;

    for (const [, messages] of results) {
      for (const [msgId, fields] of messages) {
        await this.processMessage(msgId, fields);
      }
    }
  }

  private async processMessage(msgId: string, fields: string[]): Promise<void> {
    const map: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      map[fields[i]] = fields[i + 1];
    }

    const eventId = map['eventId'];
    const flightIata = map['flightIata'] || null;
    const affectedOrigin = map['affectedOrigin'] || null;

    if (flightIata || affectedOrigin) {
      const bookings = await this.prisma.bookingRecord.findMany({
        where: flightIata ? { providerRef: flightIata } : { origin: affectedOrigin! },
        include: { itinerary: { select: { userId: true } } },
      });

      const userIds = [...new Set(bookings.map((b) => b.itinerary.userId))];

      if (userIds.length > 0) {
        await this.prisma.notificationLog.createMany({
          data: userIds.map((userId) => ({
            userId,
            eventId,
            channel: 'in-app',
            success: true,
          })),
        });
      }
    }

    await this.redis.client.xack(
      NotificationService.STREAM_KEY,
      NotificationService.GROUP,
      msgId,
    );
  }

  async findAll(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: NotificationLog[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { userId },
        orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificationLog.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async markRead(id: string, userId: string): Promise<NotificationLog> {
    const log = await this.prisma.notificationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Notification not found');
    if (log.userId !== userId) throw new ForbiddenException();
    return this.prisma.notificationLog.update({
      where: { id },
      data: { read: true },
    });
  }
}
