import { BadRequestException } from '@nestjs/common';
import {
  Command,
  CommandHandler,
  ICommandHandler,
  EventBus,
} from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { UsersService } from '../users.service';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';
import { BcryptService } from '../../../utils/bcrypt.service';
import { EmailConfirmationStatus } from '../../domain/enums/user.enum';
import { CreateUserDto } from '../../infrastructure/dto/create-user.dto';
import { UserRegisteredEvent } from 'src/modules/notifications/events/send-registration-email.event';

export class CreateUserCommand extends Command<{ userId: string }> {
  constructor(
    public readonly dto: { login: string; password: string; email: string },
  ) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly eventBus: EventBus,
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

    const createUserDto: CreateUserDto = {
      email,
      login,
      passwordHash,
      confirmationCode,
      expirationDate,
      confirmationStatus: EmailConfirmationStatus.Pending,
    };

    const result = await this.pgUsersRepository.createUser(createUserDto);

    // Send confirmation email
    this.eventBus.publish(new UserRegisteredEvent(email, confirmationCode));

    return result;
  }
}
