import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller';
import { BlogsService } from './app/blogs.service';
import { BlogsQueryRepository } from './infrastructure/query/blogs.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.entity';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { Post, PostSchema } from './domain/post.entity';
import { PostsController } from './api/posts.controller';
import { PostsQueryRepository } from './infrastructure/query/posts.query-repository';
import { PostsService } from './app/posts.service';
import { PostsRepository } from './infrastructure/posts.repository';
import { CreateBlogUseCase } from './app/blogs.use-cases/create-blog.use-case';
import { UpdateBlogUseCase } from './app/blogs.use-cases/update-blog.use-case';
import { DeleteBlogUseCase } from './app/blogs.use-cases/delete-blog.use-case';

const blogsUseCases = [CreateBlogUseCase, UpdateBlogUseCase, DeleteBlogUseCase];

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Blog.name,
        schema: BlogSchema,
      },
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),
  ],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsService,
    BlogsQueryRepository,
    BlogsRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    ...blogsUseCases,
  ],
})
export class BloggersPlatformModule {}
