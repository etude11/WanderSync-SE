import { Injectable } from '@nestjs/common';
import { IBookingStrategy } from './strategies/booking-strategy.interface';

@Injectable()
export class ProviderRegistryService {
  private readonly strategies = new Map<string, IBookingStrategy>();

  register(strategy: IBookingStrategy): void {
    if (!this.strategies.has(strategy.providerKey)) {
      this.strategies.set(strategy.providerKey, strategy);
    }
  }

  getAll(): IBookingStrategy[] {
    return [...this.strategies.values()];
  }
}
