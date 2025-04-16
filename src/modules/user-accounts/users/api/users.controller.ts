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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../app/use-cases/delete-user.use-case';
import { GetUsersQueryParams } from './input-dto/get-users.query-params.input-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import {
  GetAllUsersSwagger,
  CreateUserSwagger,
  DeleteUserSwagger,
} from './swagger';
import { PGUserViewDto } from './view-dto/users.view-dto';
import { AdminCreateUserCommand } from '../app/use-cases/admin-create-user.use-case';
import { GetAllUsersQuery } from '../app/queries/get-all-users.query';
import { GetUserByIdQuery } from '../app/queries/get-user-by-id.query';

@UseGuards(BasicAuthGuard)
@Controller(PATHS.SA_USERS)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetAllUsersSwagger()
  async getAllUsers(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<PGUserViewDto[]>> {
    return await this.queryBus.execute(new GetAllUsersQuery(query));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateUserSwagger()
  async createUser(
    @Body() createUserDto: CreateUserInputDto,
  ): Promise<PGUserViewDto> {
    const { userId } = await this.commandBus.execute(
      new AdminCreateUserCommand(createUserDto),
    );

    return await this.queryBus.execute(new GetUserByIdQuery(userId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteUserSwagger()
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
