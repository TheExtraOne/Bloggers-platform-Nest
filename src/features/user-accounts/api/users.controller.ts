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
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users.query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated-view.dto';
import { UserViewDto } from './view-dto/users.view-dto';
import { PATHS } from '../../../constants';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { CreateUserUseCase } from '../app/users.use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../app/users.use-cases/delete-user.use-case';
import { ConfirmEmailRegistrationCommand } from '../app/auth.use-cases/confirm-email-registration.use-case';
import { CommandBus } from '@nestjs/cqrs';

@UseGuards(BasicAuthGuard)
@Controller(PATHS.USERS)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
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
    const { userId, confirmationCode } =
      await this.createUserUseCase.execute(createUserDto);

    // Send confirm email if user was created manually
    await this.commandBus.execute(
      new ConfirmEmailRegistrationCommand({ code: confirmationCode }),
    );

    return await this.usersQueryRepository.findUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id);
  }
}
