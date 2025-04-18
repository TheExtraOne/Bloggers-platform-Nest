import { Injectable, NotFoundException } from '@nestjs/common';
import { PGMeViewDto, PGUserViewDto } from '../../api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ERRORS } from '../../../../../constants';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { Users } from '../../domain/entities/user.entity';

@Injectable()
export class PgUsersQueryRepository extends PgBaseRepository {
  private readonly allowedColumns = ['created_at', 'login', 'email'] as const;

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {
    super();
  }

  async findAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<PGUserViewDto[]>> {
    const {
      sortBy,
      sortDirection,
      pageNumber,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
    } = query;

    const upperCaseSortDirection = sortDirection.toUpperCase() as unknown as
      | 'ASC'
      | 'DESC';
    const sortColumn = this.getSortColumn(sortBy, this.allowedColumns);
    const { offset, limit } = this.getPaginationParams(pageNumber, pageSize);

    const builder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id AS id',
        'user.login AS login',
        'user.email AS email',
        'user.created_at AS "createdAt"',
      ])
      .orderBy(`user.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit);

    this.applySearchFilters(builder, searchLoginTerm, searchEmailTerm);

    const totalCountBuilder = this.usersRepository.createQueryBuilder('user');
    this.applySearchFilters(
      totalCountBuilder,
      searchLoginTerm,
      searchEmailTerm,
    );

    const [users, totalCount] = await Promise.all([
      builder.getRawMany<PGUserViewDto>(),
      totalCountBuilder.getCount(),
    ]);

    return PaginatedViewDto.mapToView({
      items: users,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async findUserById(id: string): Promise<PGUserViewDto> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    }

    const user: Users | null = await this.usersRepository.findOne({
      where: { id: +id },
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return PGUserViewDto.mapToView(user);
  }

  async findMe(id: string): Promise<PGMeViewDto> {
    const user: Users | null = await this.usersRepository.findOne({
      where: { id: +id },
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return PGMeViewDto.mapToView(user);
  }

  private applySearchFilters(
    builder: SelectQueryBuilder<Users>,
    searchLoginTerm: string | null,
    searchEmailTerm: string | null,
  ): void {
    const whereConditions: string[] = [];
    const parameters: Record<string, string> = {};

    if (searchLoginTerm) {
      whereConditions.push('user.login ILIKE :login');
      parameters.login = `%${searchLoginTerm}%`;
    }

    if (searchEmailTerm) {
      whereConditions.push('user.email ILIKE :email');
      parameters.email = `%${searchEmailTerm}%`;
    }

    if (whereConditions.length > 0) {
      builder.where(whereConditions.join(' OR '), parameters);
    }
  }
}
