import { UserDocument } from '../../domain/user.entity';
import { TPgUser } from '../../infrastructure/query/pg.users.query-repository';

export class MongoUserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserDocument): MongoUserViewDto {
    const dto = new MongoUserViewDto();

    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;

    return dto;
  }
}
export class PGUserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: TPgUser): PGUserViewDto {
    const dto = new PGUserViewDto();

    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.created_at;

    return dto;
  }
}
