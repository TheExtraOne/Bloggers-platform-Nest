import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { ERRORS } from 'src/constants';
import { User, UserModelType, UserDocument } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async save(user: UserDocument): Promise<void> {
    await user.save();
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

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
      deletedAt: null,
    });
  }

  async findUserByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
      deletedAt: null,
    });
  }

  async findUserByPasswordRecoveryCode(
    recoveryCode: string,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      'passwordRecovery.recoveryCode': recoveryCode,
      deletedAt: null,
    });
  }

  async isUniqueInDatabase({
    fieldName,
    fieldValue,
  }: {
    fieldName: string;
    fieldValue: string;
  }): Promise<boolean> {
    const user = await this.UserModel.findOne({
      [fieldName]: fieldValue,
      deletedAt: null,
    });

    return !user;
  }
}
