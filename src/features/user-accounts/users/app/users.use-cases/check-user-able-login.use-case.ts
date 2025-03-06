import { UnauthorizedException } from '@nestjs/common';
import { MgUsersRepository } from '../../infrastructure/mg.users.repository';
import { EmailConfirmationStatus } from '../../domain/email-confirmation.schema';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptService } from '../../../utils/bcrypt.service';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';

export class CheckIfUserIsAbleToLoginCommand extends Command<string> {
  constructor(
    public loginOrEmail: string,
    public password: string,
  ) {
    super();
  }
}

@CommandHandler(CheckIfUserIsAbleToLoginCommand)
export class CheckIfUserIsAbleToLoginUseCase
  implements ICommandHandler<CheckIfUserIsAbleToLoginCommand, string>
{
  constructor(
    private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: CheckIfUserIsAbleToLoginCommand): Promise<string> {
    const { loginOrEmail, password } = command;
    // For MongoDB
    // await this.mgUsersRepository.findUserByLoginOrEmail(loginOrEmail);
    // For Postgres
    const user: {
      id: string;
      confirmationStatus: EmailConfirmationStatus;
      passwordHash: string;
    } | null =
      await this.pgUsersRepository.findUserByLoginOrEmail(loginOrEmail);

    // Check that such user exists
    if (!user) {
      throw new UnauthorizedException();
    }

    // Check that user confirmed his email
    if (user.confirmationStatus === EmailConfirmationStatus.Pending) {
      throw new UnauthorizedException();
    }
    // Check that user password is correct
    const isPasswordCorrect = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isPasswordCorrect) throw new UnauthorizedException();

    // For MongoDB
    // return user._id.toString();
    // For Postgres
    return user.id;
  }
}
