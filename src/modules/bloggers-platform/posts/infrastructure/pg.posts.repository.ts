import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';
import { TPgPost } from './query/pg.posts.query-repository';
import { Posts } from '../domain/entities/post.entity';
import { Blogs } from '../../blogs/domain/entities/blog.entity';

@Injectable()
export class PgPostsRepository extends PgBaseRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Posts)
    private readonly postsRepository: Repository<Posts>,
  ) {
    super();
  }

  async createPost(dto: {
    title: string;
    content: string;
    shortDescription: string;
    blog: Blogs;
  }): Promise<{ postId: string }> {
    const { title, content, shortDescription, blog } = dto;

    const newPost = new Posts();

    newPost.title = title;
    newPost.content = content;
    newPost.shortDescription = shortDescription;
    newPost.blog = blog;

    await this.postsRepository.save(newPost);

    return { postId: newPost.id.toString() };
  }
  // TODO
  async updatePost(
    postId: string,
    blogId: string,
    dto: {
      title: string;
      content: string;
      shortDescription: string;
    },
  ): Promise<void> {
    if (!this.isCorrectUuid(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const { title, content, shortDescription } = dto;
    const query = `
      UPDATE public.posts
      SET title = $1, content = $2, short_description = $3, updated_at = $4
      WHERE id = $5 AND deleted_at IS NULL AND blog_id = $6;
    `;
    const params = [
      title,
      content,
      shortDescription,
      new Date(),
      postId,
      blogId,
    ];
    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
  }
  // TODO
  async deletePost(postId: string, blogId: string): Promise<void> {
    if (!this.isCorrectUuid(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const query = `
      UPDATE public.posts
      SET deleted_at = $1
      WHERE id = $2 AND deleted_at IS NULL AND blog_id = $3;
    `;
    const params = [new Date(), postId, blogId];
    const result = await this.dataSource.query(query, params);

    // `result[1]` contains the number of affected rows.
    if (result[1] === 0) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
  }
  // TODO
  async findPostById(postId: string): Promise<TPgPost | null> {
    if (!this.isCorrectUuid(postId)) {
      return null;
    }
    const query = `
      SELECT posts.*
      FROM public.posts as posts
      WHERE posts.id = $1
      AND posts.deleted_at IS NULL
    `;
    const params = [postId];
    const result = await this.dataSource.query(query, params);
    const post = result[0];

    if (!post) {
      return null;
    }

    return post;
  }
}
