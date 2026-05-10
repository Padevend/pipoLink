export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
}
