import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { EmailService } from '../facades/email.service';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { PasswordRecoveryStatus } from '../../domain/password-recovery.schema';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class SendRecoverPasswordEmailCommand {
  constructor(public readonly dto: PasswordRecoveryInputDto) {}
}

@CommandHandler(SendRecoverPasswordEmailCommand)
export class SendRecoverPasswordEmailUseCase
  implements ICommandHandler<SendRecoverPasswordEmailCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: SendRecoverPasswordEmailCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(command.dto.email);
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
      userEmail: command.dto.email,
      recoveryCode: newRecoveryCode,
    });
  }
}
