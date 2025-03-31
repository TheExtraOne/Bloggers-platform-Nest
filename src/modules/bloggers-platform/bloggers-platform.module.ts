import { Module } from '@nestjs/common';
import { PostsController } from './posts/api/posts.controller';
import { CreateCommentUseCase } from './comments/app/command.use-cases/create-comment.use-case';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { SaBlogsController } from './blogs/api/sa.blogs.controller';
import { CreateBlogUseCase } from './blogs/app/blogs.use-cases/create-blog.use-case';
import { DeleteBlogUseCase } from './blogs/app/blogs.use-cases/delete-blog.use-case';
import { UpdateBlogUseCase } from './blogs/app/blogs.use-cases/update-blog.use-case';
import { CreatePostUseCase } from './posts/app/posts.use-cases/create-post.use-case';
import { DeletePostUseCase } from './posts/app/posts.use-cases/delete-post.use-case';
import { UpdatePostUseCase } from './posts/app/posts.use-cases/update-post.use-case';
import { CommentsController } from './comments/api/comments.controller';
import { UpdateCommentUseCase } from './comments/app/command.use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './comments/app/command.use-cases/delete-comment.use-case';
import { UpdateLikeStatusUseCase } from './likes/app/likes.use-cases/update-like-status.use-case';
import { EnrichEntityWithLikeUseCase } from './likes/app/likes.use-cases/enrich-entity-with-like.use-case';
import { BlogIdExistsRule } from './decorators/blog-id-exists.decorator';
import { PgBlogsRepository } from './blogs/infrastructure/pg.blogs.repository';
import { PgBlogsQueryRepository } from './blogs/infrastructure/query/pg.blogs.query-repository';
import { BlogsController } from './blogs/api/blogs.controller';
import { PgPostsRepository } from './posts/infrastructure/pg.posts.repository';
import { PgPostsQueryRepository } from './posts/infrastructure/query/pg.posts.query-repository';
import { PgCommentsRepository } from './comments/infrastructure/pg.comments.repository';
import { PgCommentsQueryRepository } from './comments/infrastructure/query/pg.comments.query-repository';
import { PgLikesRepository } from './likes/infrastructure/pg.likes.repository';
import { EnrichEntitiesWithLikesUseCase } from './likes/app/likes.use-cases/enrich-entities-with-likes.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blogs } from './blogs/domain/entities/blog.entity';

const blogsUseCases = [CreateBlogUseCase, UpdateBlogUseCase, DeleteBlogUseCase];
const postsUseCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];
const commentsUseCases = [
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
];
const likesUseCases = [
  UpdateLikeStatusUseCase,
  EnrichEntityWithLikeUseCase,
  EnrichEntitiesWithLikesUseCase,
];

@Module({
  imports: [UserAccountsModule, TypeOrmModule.forFeature([Blogs])],
  controllers: [
    SaBlogsController,
    BlogsController,
    PostsController,
    CommentsController,
  ],
  providers: [
    PgBlogsQueryRepository,
    PgBlogsRepository,
    PgPostsRepository,
    PgPostsQueryRepository,
    PgCommentsRepository,
    PgCommentsQueryRepository,
    PgLikesRepository,
    ...blogsUseCases,
    ...postsUseCases,
    ...commentsUseCases,
    ...likesUseCases,
    BlogIdExistsRule,
  ],
})
export class BloggersPlatformModule {}
