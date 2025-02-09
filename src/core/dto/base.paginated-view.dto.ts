// Basic class for view models for requests for a list with pagination.
export abstract class PaginatedViewDto<T> {
  abstract items: T;
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;

  // Static method for mapping
  public static mapToView<T>(data: {
    items: T;
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      items: data.items,
    };
  }
}
