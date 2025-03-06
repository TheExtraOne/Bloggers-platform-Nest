import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../utils/email.service';
import { EmailConfirmationStatus } from '../../../users/domain/email-confirmation.schema';
import { UserDocument } from '../../../users/domain/user.entity';
import { MgUsersRepository } from '../../../users/infrastructure/mg.users.repository';
import { ResendRegistrationInputDto } from '../../api/input-dto/resend-registration.input-dto';
import { PgUsersRepository } from '../../../users/infrastructure/pg.users.repository';
import { PGUserViewDto } from '../../../users/api/view-dto/users.view-dto';

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
    private readonly mgUsersRepository: MgUsersRepository,
    private readonly pgUsersRepository: PgUsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: ResendRegistrationEmailCommand): Promise<void> {
    // For MongoDB
    // const user: UserDocument | null =
    //   await this.mgUsersRepository.findUserByLoginOrEmail(command.dto.email);

    // TODO: refactor types
    // For Postgres
    const user: {
      id: string;
      confirmationStatus: EmailConfirmationStatus;
    } | null = await this.pgUsersRepository.findUserByEmail(command.dto.email);

    // Check if user with such email exists
    if (!user) {
      throw new BadRequestException([
        { field: 'email', message: 'incorrect email' },
      ]);
    }
    // Check if confirmationCode has already been applied
    if (user.confirmationStatus === EmailConfirmationStatus.Confirmed) {
      throw new BadRequestException([
        { field: 'email', message: 'already confirmed' },
      ]);
    }

    // Update user confirmationCode and expirationDate
    const newConfirmationCode = new ObjectId().toString();
    const newExpirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });

    // For MongoDB
    // user.setNewConfirmationData({
    //   confirmationStatus: EmailConfirmationStatus.Pending,
    //   confirmationCode: newConfirmationCode,
    //   expirationDate: newExpirationDate,
    // });
    // await this.mgUsersRepository.save(user);

    // For Postgres
    await this.pgUsersRepository.setNewEmailConfirmationData(
      user.id,
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
