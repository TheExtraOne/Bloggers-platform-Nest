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
  UseGuards,
} from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated-view.dto';
import { PATHS } from '../../../../constants';
import { BasicAuthGuard } from '../../guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../app/users.use-cases/delete-user.use-case';
import { GetUsersQueryParams } from './input-dto/get-users.query-params.input-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import {
  GetAllUsersSwagger,
  CreateUserSwagger,
  DeleteUserSwagger,
} from './swagger';
import { PGUserViewDto } from './view-dto/users.view-dto';
import { AdminCreateUserCommand } from '../app/users.use-cases/admin-create-user.use-case';
import { PgUsersQueryRepository } from '../infrastructure/query/pg.users.query-repository';

@UseGuards(BasicAuthGuard)
@Controller(PATHS.SA_USERS)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly pgUsersQueryRepository: PgUsersQueryRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetAllUsersSwagger()
  async getAllUsers(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<PGUserViewDto[]>> {
    // ): Promise<PaginatedViewDto<MongoUserViewDto[]>> {
    // For MongoDB
    //   return this.mgUsersQueryRepository.findAll(query);

    // For Postgres
    return await this.pgUsersQueryRepository.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateUserSwagger()
  async createUser(
    @Body() createUserDto: CreateUserInputDto,
    // ): Promise<MongoUserViewDto> {
  ): Promise<PGUserViewDto> {
    const { userId } = await this.commandBus.execute(
      new AdminCreateUserCommand(createUserDto),
    );
    // For MongoDB
    // return await this.mgUsersQueryRepository.findUserById(userId);

    // For Postgres
    return await this.pgUsersQueryRepository.findUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteUserSwagger()
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
