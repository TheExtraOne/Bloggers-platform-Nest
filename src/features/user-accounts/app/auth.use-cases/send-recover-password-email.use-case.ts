import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { EmailService } from '../facades/email.service';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { PasswordRecoveryStatus } from '../../domain/password-recovery.schema';

@Injectable()
export class SendRecoverPasswordEmailUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: PasswordRecoveryInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(dto.email);
    // Even if current email is not registered (for prevent user's email detection)
    if (!user) return;

    // Set recovery code, status and expiration date
    const newRecoveryCode = new ObjectId().toString();
    user.updateRecoveryPassword({
      recoveryCode: newRecoveryCode,
      expirationDate: add(new Date(), {
        hours: 1,
        minutes: 30,
      }),
      recoveryStatus: PasswordRecoveryStatus.Pending,
    });

    await this.usersRepository.save(user);

    // Send recovery password letter
    this.emailService.sendRecoveryPasswordMail({
      userEmail: dto.email,
      recoveryCode: newRecoveryCode,
    });
  }
}
