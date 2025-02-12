import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { BcryptService } from './bcrypt.service';

type TExtension = {
  field: string | null;
  message: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserInputDto): Promise<string> {
    // Check if user with such email and login exists
    const isUnique = await this.checkIfFieldIsUnique({
      email: dto.email,
      login: dto.login,
    });

    if (isUnique.length > 0) {
      throw new BadRequestException(isUnique);
    }

    const passwordHash = await this.bcryptService.hashPassword(
      dto.password,
      10,
    );

    const newUser = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
    });
    await this.usersRepository.save(newUser);

    return newUser._id.toString();
  }

  async deleteUser(id: string): Promise<void> {
    const user: UserDocument = await this.usersRepository.findUserById(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  private async checkIfFieldIsUnique({
    email,
    login,
  }: {
    email: string | null;
    login: string | null;
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
