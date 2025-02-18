import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfirmRegistrationInputDto } from '../../api/input-dto/confirm-registration.input-dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { EmailConfirmationStatus } from '../../domain/email-confirmation.schema';

@Injectable()
export class ConfirmEmailRegistrationUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(dto: ConfirmRegistrationInputDto): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.findUserByConfirmationCode(dto.code);
    // Check if user with such confirmationCode exist
    if (!user)
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if confirmationCode has already been applied
    if (
      user.emailConfirmation.confirmationStatus ===
      EmailConfirmationStatus.Confirmed
    )
      throw new BadRequestException([
        { field: 'code', message: 'already confirmed' },
      ]);

    // Check if confirmationCode expired
    if (user.emailConfirmation.expirationDate < new Date())
      throw new BadRequestException([
        { field: 'code', message: 'already expired' },
      ]);

    // If ok, then updating user flag
    user.updateEmailConfirmation({ status: EmailConfirmationStatus.Confirmed });

    await this.usersRepository.save(user);
  }
}
