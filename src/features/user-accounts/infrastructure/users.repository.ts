import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { ERRORS } from 'src/settings';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async save(user: UserDocument): Promise<UserDocument> {
    return this.UserModel.create(user);
  }

  async findUserById(id: string): Promise<UserDocument> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    const user = await this.UserModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return user;
  }
}
