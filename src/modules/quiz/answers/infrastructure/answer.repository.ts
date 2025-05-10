import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { EntityManager, Repository } from 'typeorm';
import { Answers } from '../domain/answers.entity';

@Injectable()
export class AnswerRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Answers)
    private readonly answerRepository: Repository<Answers>,
  ) {
    super();
  }

  async save(answer: Answers, manager?: EntityManager): Promise<Answers> {
    if (manager) {
      return manager.save(answer);
    }
    return this.answerRepository.save(answer);
  }

  async findPlayerAnswersInGame(
    gameId: string,
    playerProgressId: string,
    manager?: EntityManager,
  ): Promise<Answers[]> {
    const repository = manager
      ? manager.getRepository(Answers)
      : this.answerRepository;
    return repository.find({
      where: {
        pairGame: { id: +gameId },
        playerProgress: { id: +playerProgressId },
      },
      order: { createdAt: 'ASC' },
    });
  }
}
