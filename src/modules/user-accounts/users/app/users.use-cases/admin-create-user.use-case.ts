import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';
import { BcryptService } from '../../../utils/bcrypt.service';
import { EmailConfirmationStatus } from '../../domain/enums/user.enum';
import { CreateUserDto } from '../../infrastructure/dto/create-user.dto';

export class AdminCreateUserCommand extends Command<{ userId: string }> {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {
    super();
  }
}

@CommandHandler(AdminCreateUserCommand)
export class AdminCreateUserUseCase
  implements ICommandHandler<AdminCreateUserCommand>
{
  constructor(
    private readonly usersService: UsersService,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: AdminCreateUserCommand) {
    const { login, email, password } = command.dto;

    const validationError = await this.usersService.validateUserCredentials(
      login,
      email,
    );
    if (validationError) {
      throw new BadRequestException([validationError]);
    }

    const passwordHash = await this.bcryptService.hashPassword(password);

    const createUserDto: CreateUserDto = {
      email,
      login,
      passwordHash,
      confirmationCode: null,
      expirationDate: null,
      confirmationStatus: EmailConfirmationStatus.Confirmed,
    };

    return await this.pgUsersRepository.createUser(createUserDto);
  }
}

// TODO: add query bus
// TODO: add event bus + extract into a separate module
