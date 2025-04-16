import { Module } from '@nestjs/common';
import { PostsController } from './posts/api/posts.controller';
import { CreateCommentUseCase } from './comments/app/use-cases/create-comment.use-case';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { SaBlogsController } from './blogs/api/sa.blogs.controller';
import { CreateBlogUseCase } from './blogs/app/use-cases/create-blog.use-case';
import { DeleteBlogUseCase } from './blogs/app/use-cases/delete-blog.use-case';
import { UpdateBlogUseCase } from './blogs/app/use-cases/update-blog.use-case';
import { CreatePostUseCase } from './posts/app/use-cases/create-post.use-case';
import { DeletePostUseCase } from './posts/app/use-cases/delete-post.use-case';
import { UpdatePostUseCase } from './posts/app/use-cases/update-post.use-case';
import { CommentsController } from './comments/api/comments.controller';
import { UpdateCommentUseCase } from './comments/app/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './comments/app/use-cases/delete-comment.use-case';
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
import { Posts } from './posts/domain/entities/post.entity';
import { Comments } from './comments/domain/entities/comment.entity';
import { PostLikes } from './likes/domain/entities/post-like.entity';
import { CommentLikes } from './likes/domain/entities/comment-like.entity';
import { GetAllBlogsQueryHandler } from './blogs/app/queries/get-all-blogs.query';
import { GetBlogByIdQueryHandler } from './blogs/app/queries/get-blog-by-id.query';
import { GetAllPostsByBlogIdQueryHandler } from './blogs/app/queries/get-all-posts-by-blog-id.query';
import { GetPostByIdQueryHandler } from './posts/app/queries/get-post-by-id.query';
import { GetAllPostsQueryHandler } from './posts/app/queries/get-all-posts.query';
import { GetCommentByIdQueryHandler } from './comments/app/queries/get-comment-by-id.query';
import { GetAllCommentsForPostQueryHandler } from './comments/app/queries/get-all-comments-for-post.query';

const blogsUseCases = [CreateBlogUseCase, UpdateBlogUseCase, DeleteBlogUseCase];
const blogsQueries = [
  GetAllBlogsQueryHandler,
  GetBlogByIdQueryHandler,
  GetAllPostsByBlogIdQueryHandler,
];

const postsQueries = [GetPostByIdQueryHandler, GetAllPostsQueryHandler];
const postsUseCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];
const commentsQueries = [
  GetCommentByIdQueryHandler,
  GetAllCommentsForPostQueryHandler,
];

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
  imports: [
    UserAccountsModule,
    TypeOrmModule.forFeature([Blogs, Posts, Comments, PostLikes, CommentLikes]),
  ],
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
    ...blogsQueries,
    ...postsQueries,
    ...postsUseCases,
    ...commentsQueries,
    ...commentsUseCases,
    ...likesUseCases,
    BlogIdExistsRule,
  ],
})
export class BloggersPlatformModule {}
