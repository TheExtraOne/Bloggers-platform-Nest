import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { PgBaseRepository } from 'src/core/base-classes/pg.base.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PgBlogsRepository extends PgBaseRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super();
  }

  async createBlog(dto: {
    name: string;
    description: string;
    websiteUrl: string;
  }): Promise<{ blogId: string }> {
    const { name, description, websiteUrl } = dto;
    const query = `
      INSERT INTO public.blogs (name, description, website_url)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const params = [name, description, websiteUrl];
    const result = await this.dataSource.query(query, params);

    return { blogId: result[0].id };
  }
}
