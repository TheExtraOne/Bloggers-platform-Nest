import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { EmailConfirmationStatus } from '../../domain/email-confirmation.schema';
import { ResendRegistrationInputDto } from '../../api/input-dto/resend-registration.input-dto';
import { ObjectId } from 'mongodb';
import { add } from 'date-fns';
import { EmailService } from '../facades/email.service';

// TODO: add command handler
@Injectable()
export class ResendRegistrationEmailUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: ResendRegistrationInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByLoginOrEmail(dto.email);
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
      email: dto.email,
      confirmationCode: newConfirmationCode,
    });
  }
}
