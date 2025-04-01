import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptService } from '../../../utils/bcrypt.service';
import { NewPasswordInputDto } from '../../api/input-dto/new-password.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { PasswordRecoveryStatus } from '../../../users/domain/enums/user.enum';
import { Users } from '../../../users/domain/entities/user.entity';

export class SetNewPasswordCommand extends Command<void> {
  constructor(public readonly dto: NewPasswordInputDto) {
    super();
  }
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordUseCase
  implements ICommandHandler<SetNewPasswordCommand>
{
  constructor(
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({ dto }: SetNewPasswordCommand): Promise<void> {
    const user: Users | null =
      await this.pgUsersRepository.findUserByPasswordRecoveryCode(
        dto.recoveryCode,
      );

    // Check if user with such recoveryCode exist
    if (!user) {
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'incorrect recoveryCode' },
      ]);
    }
    // Check if recoveryCode has already been applied
    if (user.passwordRecovery.status === PasswordRecoveryStatus.Confirmed) {
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'already confirmed' },
      ]);
    }
    // Check if recoveryCode expired
    if (
      user.passwordRecovery.expirationDate &&
      user.passwordRecovery.expirationDate < new Date()
    ) {
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'already expired' },
      ]);
    }
    // If ok, then updating user password
    const passwordHash = await this.bcryptService.hashPassword(
      dto.newPassword,
      10,
    );

    await this.pgUsersRepository.confirmPasswordRecovery(
      user.id.toString(),
      passwordHash,
    );
  }
}
