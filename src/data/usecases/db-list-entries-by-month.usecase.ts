import {
  ListEntriesByMonthRequest,
  ListEntriesByMonthResponse,
  ListEntriesByMonthUseCase,
} from '@domain/usecases/list-entries-by-month.usecase';
import { EntryRepository } from '../protocols/repositories/entry-repository';
import { UserRepository } from '../protocols/repositories/user-repository';

export class DbListEntriesByMonthUseCase implements ListEntriesByMonthUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    request: ListEntriesByMonthRequest,
  ): Promise<ListEntriesByMonthResponse> {
    // Validate user ID
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    // Validate year and month
    if (!request.year || request.year < 1900 || request.year > 2100) {
      throw new Error('Invalid year');
    }

    if (!request.month || request.month < 1 || request.month > 12) {
      throw new Error('Invalid month');
    }

    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Set default values for pagination and filters
    const page = Math.max(1, request.page || 1);
    const limit = Math.min(100, Math.max(1, request.limit || 20));
    const sort = ['date', 'amount', 'description'].includes(request.sort || '')
      ? request.sort
      : 'date';
    const order = ['asc', 'desc'].includes(request.order || '')
      ? request.order
      : 'desc';
    const type = ['INCOME', 'EXPENSE', 'all'].includes(request.type || '')
      ? request.type
      : 'all';

    // Get entries with filters and pagination from repository
    const result = await this.entryRepository.findByUserIdAndMonthWithFilters({
      userId: request.userId,
      year: request.year,
      month: request.month,
      page,
      limit,
      sort,
      order,
      type,
      categoryId: request.categoryId,
      search: request.search,
      isPaid: request.isPaid,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(result.total / limit);
    const hasNext = page * limit < result.total;
    const hasPrev = page > 1;

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext,
        hasPrev,
      },
      summary: {
        totalIncome: result.totalIncome,
        totalExpenses: result.totalExpenses,
        balance: result.totalIncome - result.totalExpenses,
        entriesCount: result.total,
      },
    };
  }
}
