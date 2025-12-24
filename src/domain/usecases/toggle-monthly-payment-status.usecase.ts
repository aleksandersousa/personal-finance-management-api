export interface ToggleMonthlyPaymentStatusRequest {
  entryId: string;
  userId: string;
  year: number;
  month: number;
  isPaid: boolean;
}

export interface ToggleMonthlyPaymentStatusResponse {
  entryId: string;
  year: number;
  month: number;
  isPaid: boolean;
  paidAt: Date | null;
}

export interface ToggleMonthlyPaymentStatusUseCase {
  execute(
    request: ToggleMonthlyPaymentStatusRequest,
  ): Promise<ToggleMonthlyPaymentStatusResponse>;
}
