import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserInputDto } from '../../api/input-dto/users.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { BcryptService } from '../facades/bcrypt.service';
import { ObjectId } from 'mongodb';
import { EmailService } from '../facades/email.service';

type TExtension = {
  field: string | null;
  message: string;
};

// TODO: add command handler
@Injectable()
export class CreateUserUseCase {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    dto: CreateUserInputDto,
  ): Promise<{ userId: string; confirmationCode: string }> {
    // Check if user with such email and login exists
    const isUnique = await this.checkIfFieldIsUnique({
      email: dto.email,
      login: dto.login,
    });

    if (isUnique.length > 0) {
      throw new BadRequestException(isUnique);
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
