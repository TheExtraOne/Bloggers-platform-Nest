import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ERRORS } from '../../../../constants';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
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

  async getBlogById(
    id: string,
  ): Promise<{ blogId: string; blogName: string } | null> {
    if (!this.isCorrectNumber(id)) {
      return null;
    }
    const query = `
      SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL;
    `;
    const params = [id];
    const result = await this.dataSource.query(query, params);
    const blog = result[0];

    return blog ? { blogId: blog.id, blogName: blog.name } : null;
  }

  async updateBlog(
    id: string,
    dto: {
      name: string;
      description: string;
      websiteUrl: string;
    },
  ): Promise<void> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }

    const { name, description, websiteUrl } = dto;
    const query = `
      UPDATE blogs
      SET name = $1, description = $2, website_url = $3, updated_at = NOW()
      WHERE id = $4 AND deleted_at IS NULL;
    `;
    const params = [name, description, websiteUrl, id];

    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }
  }

  async deleteBlog(id: string): Promise<void> {
    if (!this.isCorrectNumber(id)) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }
    const query = `
      UPDATE blogs
      SET deleted_at = $1
      WHERE id = $2 AND deleted_at IS NULL
    `;
    const params = [new Date(), id];

    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.BLOG_NOT_FOUND);
    }
  }
}
