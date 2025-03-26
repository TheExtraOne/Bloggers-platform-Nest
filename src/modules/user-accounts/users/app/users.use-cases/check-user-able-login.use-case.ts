import { UnauthorizedException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptService } from '../../../utils/bcrypt.service';
import { PgUsersRepository } from '../../infrastructure/pg.users.repository';
import { EmailConfirmationStatus } from '../../domain/enums/user.enums';
import { Users } from '../../domain/entities/user.entity';

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
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: CheckIfUserIsAbleToLoginCommand): Promise<string> {
    const { loginOrEmail, password } = command;

    const user: Users | null =
      await this.pgUsersRepository.findUserByLoginOrEmail(loginOrEmail);

    // Check that such user exists
    if (!user) {
      throw new UnauthorizedException();
    }

    // Check that user confirmed his email
    if (user.emailConfirmation.status === EmailConfirmationStatus.Pending) {
      throw new UnauthorizedException();
    }
    // Check that user password is correct
    const isPasswordCorrect = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isPasswordCorrect) throw new UnauthorizedException();

    return user.id.toString();
  }
}
