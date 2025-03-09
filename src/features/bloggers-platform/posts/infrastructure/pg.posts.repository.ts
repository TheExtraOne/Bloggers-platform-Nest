import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PgBaseRepository } from 'src/core/base-classes/pg.base.repository';

@Injectable()
export class PgPostsRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createPost(dto: {
    title: string;
    content: string;
    shortDescription: string;
    blogId: string;
  }): Promise<{ postId: string }> {
    const { title, content, shortDescription, blogId } = dto;
    const query = `
      INSERT INTO public.posts (title, content, short_description, blog_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const params = [title, content, shortDescription, blogId];
    const result = await this.dataSource.query(query, params);

    return { postId: result[0].id };
  }
}
