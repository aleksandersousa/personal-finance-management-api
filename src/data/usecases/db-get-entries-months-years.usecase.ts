import {
  GetEntriesMonthsYearsRequest,
  GetEntriesMonthsYearsResponse,
  GetEntriesMonthsYearsUseCase,
} from '@domain/usecases/get-entries-months-years.usecase';
import { EntryRepository } from '../protocols/repositories/entry-repository';
import { UserRepository } from '../protocols/repositories/user-repository';
import type { Logger } from '../protocols';

export class DbGetEntriesMonthsYearsUseCase
  implements GetEntriesMonthsYearsUseCase
{
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async execute(
    request: GetEntriesMonthsYearsRequest,
  ): Promise<GetEntriesMonthsYearsResponse> {
    // Validate user ID
    if (!request.userId) {
      this.logger.error('User ID is required');
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      this.logger.error('User not found');
      throw new Error('User not found');
    }

    // Get distinct months and years from repository
    const monthsYears = await this.entryRepository.getDistinctMonthsYears(
      request.userId,
    );

    return {
      monthsYears,
    };
  }
}
