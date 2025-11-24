export interface MonthYear {
  year: number;
  month: number;
}

export interface GetEntriesMonthsYearsRequest {
  userId: string;
}

export interface GetEntriesMonthsYearsResponse {
  monthsYears: MonthYear[];
}

export interface GetEntriesMonthsYearsUseCase {
  execute(
    request: GetEntriesMonthsYearsRequest,
  ): Promise<GetEntriesMonthsYearsResponse>;
}
