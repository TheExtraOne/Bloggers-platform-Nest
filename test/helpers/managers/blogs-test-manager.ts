import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PATHS } from '../../../src/constants';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../../../src/features/bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { BlogsViewDto } from '../../../src/features/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { CreatePostInputDto } from '../../../src/features/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { PostsViewDto } from '../../../src/features/bloggers-platform/posts/api/view-dto/posts.view-dto';

export class BlogsTestManager {
  constructor(private app: INestApplication) {}

  async createBlog(
    createModel: CreateBlogInputDto,
    statusCode: number = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<BlogsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.BLOGS}`)
      .auth(username, password)
      .send(createModel)
      .expect(statusCode);

    return response.body;
  }

  async updateBlog(
    id: string,
    updateModel: UpdateBlogInputDto,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${PATHS.BLOGS}/${id}`)
      .auth(username, password)
      .send(updateModel)
      .expect(statusCode);
  }

  async deleteBlog(
    id: string,
    statusCode: number = HttpStatus.NO_CONTENT,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${PATHS.BLOGS}/${id}`)
      .auth(username, password)
      .expect(statusCode);
  }

  async createPost(
    blogId: string,
    createModel: Omit<CreatePostInputDto, 'blogId'>,
    statusCode: number = HttpStatus.CREATED,
    username: string = 'admin',
    password: string = 'qwerty',
  ): Promise<PostsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post(`/${PATHS.BLOGS}/${blogId}/posts`)
      .auth(username, password)
      .send(createModel)
      .expect(statusCode);

    return response.body;
  }

  async createSeveralBlogs(count: number) {
    const blogs = [] as BlogsViewDto[];

    for (let i = 0; i < count; ++i) {
      const response = await this.createBlog({
        name: `blog${i}`,
        description: `description of blog${i}`,
        websiteUrl: `https://blog${i}.com`,
      });

      blogs.push(response);
    }

    return blogs;
  }
}
