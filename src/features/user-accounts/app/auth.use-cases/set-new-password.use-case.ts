import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { PasswordRecoveryStatus } from '../../domain/password-recovery.schema';
import { NewPasswordInputDto } from '../../api/input-dto/new-password.input-dto';
import { BcryptService } from '../facades/bcrypt.service';

// TODO: add command handler
@Injectable()
export class SetNewPasswordUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(dto: NewPasswordInputDto): Promise<void> {
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
