export interface ToggleEntryPaymentStatusRequest {
  userId: string;
  entryId: string;
  isPaid: boolean;
}

export interface ToggleEntryPaymentStatusResponse {
  entryId: string;
  isPaid: boolean;
  paidAt: Date | null;
}

export interface ToggleEntryPaymentStatusUseCase {
  execute(
    request: ToggleEntryPaymentStatusRequest,
  ): Promise<ToggleEntryPaymentStatusResponse>;
}
