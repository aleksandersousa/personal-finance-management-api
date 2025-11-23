export interface DeleteCategoryRequest {
  id: string;
  userId: string;
}

export interface DeleteCategoryResponse {
  deletedAt: Date;
}

export interface DeleteCategoryUseCase {
  execute(request: DeleteCategoryRequest): Promise<DeleteCategoryResponse>;
}
