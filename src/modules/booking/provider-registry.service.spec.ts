import { ProviderRegistryService } from './provider-registry.service';
import { IBookingStrategy, NormalizedBooking } from './strategies/booking-strategy.interface';
import { BookingType } from '@prisma/client';

const makeStrategy = (key: string, type: BookingType): IBookingStrategy => ({
  providerKey: key,
  bookingType: type,
  fetchAndNormalize: async (_refs: string[]): Promise<NormalizedBooking[]> => [],
});

describe('ProviderRegistryService', () => {
  let registry: ProviderRegistryService;

  beforeEach(() => {
    registry = new ProviderRegistryService();
  });

  it('returns empty array when no strategies registered', () => {
    expect(registry.getAll()).toHaveLength(0);
  });

  it('returns registered strategy', () => {
    const s = makeStrategy('aviationstack', BookingType.FLIGHT);
    registry.register(s);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getAll()[0].providerKey).toBe('aviationstack');
  });

  it('does not register duplicate providerKey', () => {
    const s1 = makeStrategy('aviationstack', BookingType.FLIGHT);
    const s2 = makeStrategy('aviationstack', BookingType.FLIGHT);
    registry.register(s1);
    registry.register(s2);
    expect(registry.getAll()).toHaveLength(1);
  });
});
