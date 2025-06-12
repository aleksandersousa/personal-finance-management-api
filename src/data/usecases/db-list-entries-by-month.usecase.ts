import {
  ListEntriesByMonthUseCase,
  ListEntriesByMonthRequest,
} from "@domain/usecases/list-entries-by-month.usecase";
import { EntryModel } from "@domain/models/entry.model";
import { EntryRepository } from "../protocols/entry-repository";
import { UserRepository } from "../protocols/user-repository";

export class DbListEntriesByMonthUseCase implements ListEntriesByMonthUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(request: ListEntriesByMonthRequest): Promise<EntryModel[]> {
    // Validate user ID
    if (!request.userId) {
      throw new Error("User ID is required");
    }

    // Validate year and month
    if (!request.year || request.year < 1900 || request.year > 2100) {
      throw new Error("Invalid year");
    }

    if (!request.month || request.month < 1 || request.month > 12) {
      throw new Error("Invalid month");
    }

    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get entries for the specified month
    const entries = await this.entryRepository.findByUserIdAndMonth(
      request.userId,
      request.year,
      request.month
    );

    return entries;
  }
}
