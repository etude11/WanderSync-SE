import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { NotificationService } from './notification.service';

const mockNotificationLog = {
  id: 'notif-1',
  userId: 'user1',
  eventId: 'evt-1',
  channel: 'in-app',
  deliveredAt: new Date(),
  success: true,
  read: false,
};

const mockBooking = {
  id: 'b1',
  itineraryId: 'itin1',
  provider: 'aviationstack',
  providerRef: 'AI101',
  type: BookingType.FLIGHT,
  origin: 'DEL',
  destination: 'BOM',
  departureTime: new Date(),
  arrivalTime: new Date(),
  disrupted: false,
  rawData: {},
  createdAt: new Date(),
  itinerary: { userId: 'user1' },
};

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: jest.Mocked<Pick<PrismaService, 'notificationLog' | 'bookingRecord'>>;
  let redis: {
    client: {
      xgroup: jest.Mock;
      xreadgroup: jest.Mock;
      xack: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      notificationLog: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as never,
      bookingRecord: {
        findMany: jest.fn(),
      } as never,
    };

    redis = {
      client: {
        xgroup: jest.fn().mockResolvedValue('OK'),
        xreadgroup: jest.fn(),
        xack: jest.fn().mockResolvedValue(1),
      },
    };

    service = new NotificationService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    jest.clearAllMocks();
  });

  describe('consumeStream', () => {
    it('returns early when xreadgroup returns null (no new messages)', async () => {
      redis.client.xreadgroup.mockResolvedValue(null);
      await service.consumeStream();
      expect(prisma.bookingRecord.findMany).not.toHaveBeenCalled();
      expect(prisma.notificationLog.createMany).not.toHaveBeenCalled();
    });

    it('creates NotificationLog for affected flight booking user and XACKs', async () => {
      const fields = [
        'eventId', 'evt-1',
        'type', 'FLIGHT_DELAY',
        'severity', '2',
        'description', 'Delayed',
        'flightIata', 'AI101',
        'affectedOrigin', '',
        'publishedAt', new Date().toISOString(),
      ];
      redis.client.xreadgroup.mockResolvedValue([
        ['disruption-events', [['1700000000000-0', fields]]],
      ]);
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBooking]);
      (prisma.notificationLog.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.consumeStream();

      expect(prisma.bookingRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerRef: 'AI101' } }),
      );
      expect(prisma.notificationLog.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user1', eventId: 'evt-1', channel: 'in-app', success: true }],
      });
      expect(redis.client.xack).toHaveBeenCalledWith(
        'disruption-events', 'notification', '1700000000000-0',
      );
    });

    it('XACKs message and skips NotificationLog when no bookings match', async () => {
      const fields = [
        'eventId', 'evt-2',
        'type', 'WEATHER_ALERT',
        'severity', '3',
        'description', 'Storm',
        'flightIata', '',
        'affectedOrigin', 'BOM',
        'publishedAt', new Date().toISOString(),
      ];
      redis.client.xreadgroup.mockResolvedValue([
        ['disruption-events', [['1700000000001-0', fields]]],
      ]);
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([]);

      await service.consumeStream();

      expect(prisma.notificationLog.createMany).not.toHaveBeenCalled();
      expect(redis.client.xack).toHaveBeenCalledWith(
        'disruption-events', 'notification', '1700000000001-0',
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated notifications ordered newest first', async () => {
      (prisma.notificationLog.findMany as jest.Mock).mockResolvedValue([mockNotificationLog]);
      (prisma.notificationLog.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll('user1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.notificationLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          orderBy: { deliveredAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('markRead', () => {
    it('throws NotFoundException when notification does not exist', async () => {
      (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.markRead('notif-1', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when userId does not match owner', async () => {
      (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue({
        ...mockNotificationLog,
        userId: 'other-user',
      });
      await expect(service.markRead('notif-1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('sets read = true on owned notification', async () => {
      (prisma.notificationLog.findUnique as jest.Mock).mockResolvedValue(mockNotificationLog);
      (prisma.notificationLog.update as jest.Mock).mockResolvedValue({
        ...mockNotificationLog,
        read: true,
      });

      const result = await service.markRead('notif-1', 'user1');

      expect(prisma.notificationLog.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
      expect(result.read).toBe(true);
    });
  });
});
