import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikesRepository } from '../../infrastructure/likes.repository';
import { LikeStatus } from '../../domain/like.entity';

export class GetUserStatusCommand {
  constructor(
    public userId: string,
    public entityId: string,
  ) {}
}

@CommandHandler(GetUserStatusCommand)
export class GetUserStatusUseCase
  implements ICommandHandler<GetUserStatusCommand, LikeStatus>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: GetUserStatusCommand): Promise<LikeStatus> {
    const { userId, entityId } = command;
    const like = await this.likesRepository.findLikeByUserIdAndParentId(
      userId,
      entityId,
    );

    return like ? (like.status as LikeStatus) : LikeStatus.None;
  }
}
