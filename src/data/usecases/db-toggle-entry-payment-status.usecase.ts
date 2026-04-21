import {
  ToggleEntryPaymentStatusRequest,
  ToggleEntryPaymentStatusResponse,
  ToggleEntryPaymentStatusUseCase,
} from '@domain/usecases/toggle-entry-payment-status.usecase';
import { EntryRepository } from '@/data/protocols/repositories/entry-repository';
import { UserRepository } from '@/data/protocols/repositories/user-repository';

export class DbToggleEntryPaymentStatusUseCase
  implements ToggleEntryPaymentStatusUseCase
{
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    request: ToggleEntryPaymentStatusRequest,
  ): Promise<ToggleEntryPaymentStatusResponse> {
    if (!request.userId) {
      throw new Error('User ID is required');
    }
    if (!request.entryId) {
      throw new Error('Entry ID is required');
    }

    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.entryRepository.togglePaymentStatus(
      request.userId,
      request.entryId,
      request.isPaid,
    );
  }
}
