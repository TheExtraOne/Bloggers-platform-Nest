export class PgBaseRepository {
  constructor() {}
  protected validateUserId(userId: string): boolean {
    if (isNaN(Number(userId))) {
      return false;
    }

    return true;
  }

  protected adapterCamelToSnake(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  protected adapterSnakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  protected getSortColumn(
    sortBy: string,
    allowedColumns: readonly string[],
  ): string {
    const sortBySnakeCase = this.adapterCamelToSnake(sortBy);
    return allowedColumns.includes(
      sortBySnakeCase as (typeof allowedColumns)[number],
    )
      ? sortBySnakeCase
      : 'created_at';
  }

  protected getPaginationParams(pageNumber: number, pageSize: number) {
    return {
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    };
  }
}
