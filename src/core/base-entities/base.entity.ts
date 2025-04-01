import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Interface segregation
export abstract class BaseTimestampedEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  public deletedAt: Date | null;
}

export abstract class BaseWithId extends BaseTimestampedEntity {
  @PrimaryGeneratedColumn()
  public id: number;
}
