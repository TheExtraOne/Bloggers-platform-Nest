import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Interface segregation
export abstract class BaseTimestampedEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  updatedAt: Date | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  public deletedAt: Date | null;
}

export abstract class BaseWithId extends BaseTimestampedEntity {
  @PrimaryGeneratedColumn()
  public id: number;
}
