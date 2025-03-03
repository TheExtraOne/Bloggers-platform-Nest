import { OmitType } from '@nestjs/swagger';
import { UserDocument } from '../../../users/domain/user.entity';
import { MongoUserViewDto } from '../../../users/api/view-dto/users.view-dto';

export class MeViewDto extends OmitType(MongoUserViewDto, [
  'createdAt',
  'id',
] as const) {
  userId: string;

  static mapToView(user: UserDocument): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user._id.toString();

    return dto;
  }
}
