import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { EmailService } from '../../../utils/email.service';
import { UsersService } from '../users.service';
import {
  CreateUserDomainDto,
  EmailConfirmationStatus,
  PgUsersRepository,
} from '../../infrastructure/pg.users.repository';
import { BcryptService } from 'src/features/user-accounts/utils/bcrypt.service';

export class CreateUserCommand {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: CreateUserCommand) {
    const { login, email, password } = command.dto;

    const validationError = await this.usersService.validateUserCredentials(
      login,
      email,
    );
    if (validationError) {
      throw new BadRequestException([validationError]);
    }
    const confirmationCode = uuidv4();
    const expirationDate = add(new Date(), { hours: 1, minutes: 30 });

    const passwordHash = await this.bcryptService.hashPassword(password);

    const createUserDto: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
      confirmationCode,
      expirationDate,
      confirmationStatus: EmailConfirmationStatus.Pending,
    };

    const result = await this.pgUsersRepository.createUser(createUserDto);

    // Send confirmation email
    this.emailService.sendRegistrationMail({
      email,
      confirmationCode,
    });

    return result;
  }
}
