import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserInputDto } from '../api/input-dto/users.input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserInputDto): Promise<string> {
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
}
