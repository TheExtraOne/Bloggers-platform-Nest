import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { FilterQuery } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ERRORS } from '../../../../../constants';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated-view.dto';
import { User, UserModelType } from '../../domain/user.entity';
import { GetUsersQueryParams } from '../../api/input-dto/get-users.query-params.input-dto';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findUserById(id: string): Promise<UserViewDto> {
    if (!ObjectId.isValid(id))
      throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    const user = await this.UserModel.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return UserViewDto.mapToView(user);
  }

  async findAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // Creating filter
    const filter: FilterQuery<User> = {
      deletedAt: null,
    };
    if (query.searchLoginTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        login: { $regex: query.searchLoginTerm, $options: 'i' },
      });
    }
    if (query.searchEmailTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        email: { $regex: query.searchEmailTerm, $options: 'i' },
      });
    }

    // Getting users
    const users = await this.UserModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.UserModel.countDocuments(filter);

    const items = users.map((user) => UserViewDto.mapToView(user));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
