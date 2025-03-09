import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from '../../../../../core/base-classes/pg.base.repository';
import { PgPostsViewDto } from '../../api/view-dto/posts.view-dto';

export type TPgPost = {
  id: string;
  title: string;
  short_description: string;
  content: string;
  blog_id: string;
  blog_name: string;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date;
};

@Injectable()
export class PgPostsQueryRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async findPostById(postId: string): Promise<PgPostsViewDto | null> {
    if (!this.isCorrectNumber(postId)) {
      return null;
    }
    const query = `
    SELECT posts.*, blogs.name as blog_name
    FROM public.posts as posts
    JOIN public.blogs as blogs 
    ON posts.blog_id = blogs.id
    WHERE posts.id = $1
    AND posts.deleted_at IS NULL
    `;
    const params = [postId];
    const result = await this.dataSource.query(query, params);
    console.log(result);
    const post = result[0];

    return post ? PgPostsViewDto.mapToView(post) : null;
  }
}
