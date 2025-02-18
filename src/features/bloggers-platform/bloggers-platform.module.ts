import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller';
import { BlogsQueryRepository } from './infrastructure/query/blogs.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.entity';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { Post, PostSchema } from './domain/post.entity';
import { PostsController } from './api/posts.controller';
import { PostsQueryRepository } from './infrastructure/query/posts.query-repository';
import { PostsRepository } from './infrastructure/posts.repository';
import { CreateBlogUseCase } from './app/blogs.use-cases/create-blog.use-case';
import { UpdateBlogUseCase } from './app/blogs.use-cases/update-blog.use-case';
import { DeleteBlogUseCase } from './app/blogs.use-cases/delete-blog.use-case';
import { CreatePostUseCase } from './app/posts.use-cases/create-post.use-case';
import { UpdatePostUseCase } from './app/posts.use-cases/update-post.use-case';
import { DeletePostUseCase } from './app/posts.use-cases/delete-post.use-case';
import { BlogsService } from './app/blog-service';
import { CommentsRepository } from './infrastructure/comments.repository';
import { CreateCommentUseCase } from './app/command.use-cases/create-comment.use-case';
import { Comment, CommentSchema } from './domain/comment.entity';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CommentsQueryRepository } from './infrastructure/query/comments.query-repository';

const blogsUseCases = [CreateBlogUseCase, UpdateBlogUseCase, DeleteBlogUseCase];
const postsUseCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];
const commentsUseCases = [CreateCommentUseCase];

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
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsService,
    BlogsQueryRepository,
    BlogsRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentsRepository,
    CommentsQueryRepository,
    ...blogsUseCases,
    ...postsUseCases,
    ...commentsUseCases,
  ],
})
export class BloggersPlatformModule {}
