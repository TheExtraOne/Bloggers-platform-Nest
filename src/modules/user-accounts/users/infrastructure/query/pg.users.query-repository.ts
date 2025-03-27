import { Injectable, NotFoundException } from '@nestjs/common';
import { PGMeViewDto, PGUserViewDto } from '../../api/view-dto/users.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users.query-params.input-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      .orderBy(`user.${sortColumn}`, upperCaseSortDirection)
      .offset(offset)
      .limit(limit);

    // Apply filters only if searchLoginTerm or searchEmailTerm exist
    const whereConditions: string[] = [];
    const parameters: Record<string, string> = {};

    if (searchLoginTerm) {
      whereConditions.push('user.login ILIKE :login');
      parameters.login = `%${searchLoginTerm}%`;
    }

    if (searchEmailTerm) {
      whereConditions.push('user.email ILIKE :email');
      parameters.email = `%${query.searchEmailTerm}%`;
    }

    if (whereConditions.length > 0) {
      builder.where(whereConditions.join(' OR '), parameters);
    }

    const [users, totalCount] = await builder.getManyAndCount();

    const items = users.map((user) => PGUserViewDto.mapToView(user));

    return PaginatedViewDto.mapToView({
      items,
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
}
