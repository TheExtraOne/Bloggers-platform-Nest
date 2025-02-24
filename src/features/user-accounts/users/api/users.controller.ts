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
import { ConfirmEmailRegistrationCommand } from '../../auth/app/auth.use-cases/confirm-email-registration.use-case';
import { CreateUserCommand } from '../app/users.use-cases/create-user.use-case';
import { DeleteUserCommand } from '../app/users.use-cases/delete-user.use-case';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users.query-params.input-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import {
  GetAllUsersSwagger,
  CreateUserSwagger,
  DeleteUserSwagger,
} from './swagger';
import { UserViewDto } from './view-dto/users.view-dto';

@UseGuards(BasicAuthGuard)
@Controller(PATHS.USERS)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @GetAllUsersSwagger()
  async getAllUsers(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateUserSwagger()
  async createUser(
    @Body() createUserDto: CreateUserInputDto,
  ): Promise<UserViewDto> {
    const { userId, confirmationCode } = await this.commandBus.execute(
      new CreateUserCommand(createUserDto),
    );

    // Send confirm email if user was created manually
    await this.commandBus.execute(
      new ConfirmEmailRegistrationCommand({ code: confirmationCode }),
    );

    return await this.usersQueryRepository.findUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteUserSwagger()
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
