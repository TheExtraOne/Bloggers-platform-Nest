import { BadRequestException } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptService } from '../../../facades/bcrypt.service';
import { PasswordRecoveryStatus } from '../../../users/domain/password-recovery.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { NewPasswordInputDto } from '../../api/input-dto/new-password.input-dto';

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
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({ dto }: SetNewPasswordCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByPasswordRecoveryCode(
        dto.recoveryCode,
      );
    // Check if user with such recoveryCode exist
    if (!user)
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'incorrect recoveryCode' },
      ]);

    // Check if recoveryCode has already been applied
    if (
      user.passwordRecovery.recoveryStatus === PasswordRecoveryStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'already confirmed' },
      ]);

    // Check if recoveryCode expired
    if (
      user.passwordRecovery.expirationDate &&
      user.passwordRecovery.expirationDate < new Date()
    )
      throw new BadRequestException([
        { field: 'recoveryCode', message: 'already expired' },
      ]);

    // If ok, then updating user password
    const passwordHash = await this.bcryptService.hashPassword(
      dto.newPassword,
      10,
    );

    user.updateLoginPassword({ passwordHash });
    user.updateRecoveryPassword({
      recoveryStatus: PasswordRecoveryStatus.Confirmed,
      recoveryCode: null,
      expirationDate: null,
    });

    await this.usersRepository.save(user);
  }
}
