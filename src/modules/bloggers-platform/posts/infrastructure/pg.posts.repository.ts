import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PgBaseRepository } from '../../../../core/base-classes/pg.base.repository';
import { ERRORS } from '../../../../constants';
import { Posts } from '../domain/entities/post.entity';
import { Blogs } from '../../blogs/domain/entities/blog.entity';

// TODO: refactor, move create and update to entity
@Injectable()
export class PgPostsRepository extends PgBaseRepository {
  constructor(
    @InjectRepository(Posts)
    private readonly postsRepository: Repository<Posts>,
  ) {
    super();
  }

  async findPostByBlogIdAndPostIdOrThrow(
    blogId: string,
    postId: string,
  ): Promise<Posts> {
    if (!this.isCorrectNumber(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const post = await this.postsRepository.findOne({
      where: { id: +postId, blog: { id: +blogId } },
      relations: { blog: true },
    });
    if (!post) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    return post;
  }

  async findPostByIdOrThrow(postId: string): Promise<Posts> {
    if (!this.isCorrectNumber(postId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
    const post = await this.postsRepository.findOne({
      where: { id: +postId },
      relations: { blog: true },
    });
    if (!post) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }

    return post;
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

  async updatePost(
    postId: string,
    blogId: string,
    dto: {
      title: string;
      content: string;
      shortDescription: string;
    },
  ): Promise<void> {
    const { title, content, shortDescription } = dto;

    const post: Posts = await this.findPostByBlogIdAndPostIdOrThrow(
      blogId,
      postId,
    );

    post.title = title;
    post.content = content;
    post.shortDescription = shortDescription;

    await this.postsRepository.save(post);
  }

  async deletePost(postId: string, blogId: string): Promise<void> {
    if (!this.isCorrectNumber(postId) || !this.isCorrectNumber(blogId)) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }

    const result = await this.postsRepository.softDelete({
      id: +postId,
      blog: { id: +blogId },
    });

    // `result[affected]` contains the number of affected rows.
    if (result.affected === 0) {
      throw new NotFoundException(ERRORS.POST_NOT_FOUND);
    }
  }

  async checkPostExists(postId: string): Promise<boolean> {
    if (!this.isCorrectNumber(postId)) {
      return false;
    }
    return await this.postsRepository.exists({
      where: {
        id: +postId,
      },
    });
  }
}
