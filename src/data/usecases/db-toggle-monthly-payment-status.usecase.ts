import { Injectable } from '@nestjs/common';
import {
  ToggleMonthlyPaymentStatusRequest,
  ToggleMonthlyPaymentStatusResponse,
  ToggleMonthlyPaymentStatusUseCase,
} from '@domain/usecases/toggle-monthly-payment-status.usecase';
import { EntryRepository } from '@/data/protocols/repositories/entry-repository';

@Injectable()
export class DbToggleMonthlyPaymentStatusUseCase
  implements ToggleMonthlyPaymentStatusUseCase
{
  constructor(private readonly entryRepository: EntryRepository) {}

  async execute(
    request: ToggleMonthlyPaymentStatusRequest,
  ): Promise<ToggleMonthlyPaymentStatusResponse> {
    const { entryId, userId, year, month, isPaid } = request;

    // Validate that the entry exists and belongs to the user
    const entry = await this.entryRepository.findById(entryId);

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new Error('Unauthorized: Entry does not belong to user');
    }

    // Only allow toggling payment status for fixed entries
    if (!entry.isFixed) {
      throw new Error(
        'Cannot set monthly payment status for non-fixed entries',
      );
    }

    // Set the monthly payment status
    const result = await this.entryRepository.setMonthlyPaymentStatus(
      entryId,
      year,
      month,
      isPaid,
    );

    return {
      entryId: result.entryId,
      year: result.year,
      month: result.month,
      isPaid: result.isPaid,
      paidAt: result.paidAt,
    };
  }
}
