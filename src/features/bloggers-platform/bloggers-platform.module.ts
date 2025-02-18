import { Module } from '@nestjs/common';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { BlogsService } from './blogs/app/blog-service';
import { CommentsRepository } from './comments/infrastructure/comments.repository';
import { CreateCommentUseCase } from './comments/app/command.use-cases/create-comment.use-case';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { CreateBlogUseCase } from './blogs/app/blogs.use-cases/create-blog.use-case';
import { DeleteBlogUseCase } from './blogs/app/blogs.use-cases/delete-blog.use-case';
import { UpdateBlogUseCase } from './blogs/app/blogs.use-cases/update-blog.use-case';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { CreatePostUseCase } from './posts/app/posts.use-cases/create-post.use-case';
import { DeletePostUseCase } from './posts/app/posts.use-cases/delete-post.use-case';
import { UpdatePostUseCase } from './posts/app/posts.use-cases/update-post.use-case';
import { Post, PostSchema } from './posts/domain/post.entity';
import { CommentsController } from './comments/api/comments.controller';

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
  controllers: [BlogsController, PostsController, CommentsController],
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
