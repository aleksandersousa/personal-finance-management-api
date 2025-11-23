export interface DeleteEntryRequest {
  entryId: string;
  userId: string;
}

export interface DeleteEntryResponse {
  deletedAt: Date;
}

export interface DeleteEntryUseCase {
  execute(request: DeleteEntryRequest): Promise<DeleteEntryResponse>;
}
