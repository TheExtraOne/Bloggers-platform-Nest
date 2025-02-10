import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users.query-params.input-dto';
// import { PaginatedViewDto } from 'src/features/dto/base.paginated-view.dto';
import { UserViewDto } from './view-dto/users.view-dto';
import { UserService } from '../app/users.service';
import { PATHS } from 'src/settings';

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

@Controller(PATHS.USERS)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserInputDto,
  ): Promise<UserViewDto> {
    const userId: string = await this.userService.createUser(createUserDto);

    return await this.usersQueryRepository.findUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }
}
