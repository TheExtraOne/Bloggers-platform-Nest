import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../utils/email.service';
import { ResendRegistrationInputDto } from '../../api/input-dto/resend-registration.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { EmailConfirmationStatus } from '../../../users/domain/enums/user.enums';
import { Users } from '../../../users/domain/entities/user.entity';

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
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: ResendRegistrationEmailCommand): Promise<void> {
    const user: Users | null = await this.pgUsersRepository.findUserByEmail(
      command.dto.email,
    );

    // Check if user with such email exists
    if (!user) {
      throw new BadRequestException([
        { field: 'email', message: 'incorrect email' },
      ]);
    }
    // Check if confirmationCode has already been applied
    if (user.emailConfirmation.status === EmailConfirmationStatus.Confirmed) {
      throw new BadRequestException([
        { field: 'email', message: 'already confirmed' },
      ]);
    }

    // Update user confirmationCode and expirationDate
    const newConfirmationCode = uuidv4();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    await this.pgUsersRepository.setNewEmailConfirmationData(
      user.id.toString(),
      newConfirmationCode,
      newExpirationDate,
    );

    // Send confirmation letter
    this.emailService.sendRegistrationMail({
      email: command.dto.email,
      confirmationCode: newConfirmationCode,
    });
  }
}
