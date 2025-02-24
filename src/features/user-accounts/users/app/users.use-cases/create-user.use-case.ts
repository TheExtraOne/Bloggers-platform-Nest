import { BadRequestException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserInputDto } from '../../api/input-dto/users.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { ObjectId } from 'mongodb';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BcryptService } from '../../../../user-accounts/facades/bcrypt.service';
import { EmailService } from '../../../../user-accounts/facades/email.service';

type TExtension = {
  field: string | null;
  message: string;
};

export class CreateUserCommand extends Command<{
  userId: string;
  confirmationCode: string;
}> {
  constructor(public readonly dto: CreateUserInputDto) {
    super();
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    command: CreateUserCommand,
  ): Promise<{ userId: string; confirmationCode: string }> {
    const { dto } = command;
    // Check if user with such email and login exists
    const validationErrors = await this.checkIfFieldIsUnique({
      email: dto.email,
      login: dto.login,
    });

    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }

    // Hash the password
    const passwordHash = await this.bcryptService.hashPassword(
      dto.password,
      10,
    );

    const confirmationCode = new ObjectId().toString();
    const newUser = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      confirmationCode: confirmationCode,
    });
    await this.usersRepository.save(newUser);

    // Send confirmation letter
    this.emailService.sendRegistrationMail({
      email: dto.email,
      confirmationCode: confirmationCode,
    });

    return {
      userId: newUser._id.toString(),
      confirmationCode: confirmationCode,
    };
  }

  private async checkIfFieldIsUnique({
    email,
    login,
  }: {
    email?: string;
    login?: string;
  }): Promise<TExtension[] | []> {
    const errors: TExtension[] = [];
    if (login) {
      const isLoginUnique: boolean =
        await this.usersRepository.isUniqueInDatabase({
          fieldName: 'login',
          fieldValue: login,
        });
      if (!isLoginUnique) {
        errors.push({
          message: 'login already exists',
          field: 'login',
        });
      }
    }

    if (email) {
      const isEmailUnique: boolean =
        await this.usersRepository.isUniqueInDatabase({
          fieldName: 'email',
          fieldValue: email,
        });
      if (!isEmailUnique) {
        errors.push({
          message: 'email already exists',
          field: 'email',
        });
      }
    }

    return errors;
  }
}
