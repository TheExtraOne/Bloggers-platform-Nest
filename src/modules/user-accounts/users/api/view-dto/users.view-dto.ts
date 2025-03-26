import { Users } from '../../domain/entities/user.entity';

export class PGUserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date | string;

  static mapToView(user: Users): PGUserViewDto {
    const dto = new PGUserViewDto();

    dto.id = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;

    return dto;
  }
}
