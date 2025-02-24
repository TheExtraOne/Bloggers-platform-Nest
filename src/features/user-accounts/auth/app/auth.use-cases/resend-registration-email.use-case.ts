import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../facades/email.service';
import { EmailConfirmationStatus } from '../../../users/domain/email-confirmation.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { ResendRegistrationInputDto } from '../../api/input-dto/resend-registration.input-dto';

export class ResendRegistrationEmailCommand extends Command<void> {
  constructor(public readonly dto: ResendRegistrationInputDto) {
    super();
  }
}

@CommandHandler(ResendRegistrationEmailCommand)
export class ResendRegistrationEmailUseCase
  implements ICommandHandler<ResendRegistrationEmailCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: ResendRegistrationEmailCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(command.dto.email);
    // Check if user with such email exists
    if (!user)
      throw new BadRequestException([
        { field: 'email', message: 'incorrect email' },
      ]);

    // Check if confirmationCode has already been applied
    if (
      user.emailConfirmation.confirmationStatus ===
      EmailConfirmationStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'email', message: 'already confirmed' },
      ]);

    // Update user confirmationCode and expirationDate
    const newConfirmationCode = new ObjectId().toString();
    user.updateEmailConfirmation({
      status: EmailConfirmationStatus.Pending,
      confirmationCode: newConfirmationCode,
      expirationDate: add(new Date(), {
        hours: 1,
        minutes: 30,
      }),
    });

    await this.usersRepository.save(user);

    // Send confirmation letter
    this.emailService.sendRegistrationMail({
      email: command.dto.email,
      confirmationCode: newConfirmationCode,
    });
  }
}
