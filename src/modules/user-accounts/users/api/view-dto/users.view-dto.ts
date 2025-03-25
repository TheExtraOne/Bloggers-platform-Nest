import { TPgUser } from '../../infrastructure/query/pg.users.query-repository';

export class PGUserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: TPgUser): PGUserViewDto {
    const dto = new PGUserViewDto();

    dto.id = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.created_at;

    return dto;
  }
}
