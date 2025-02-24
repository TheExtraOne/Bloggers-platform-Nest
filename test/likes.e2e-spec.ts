import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { CommentsTestManager } from './helpers/managers/comments-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { deleteAllData } from './helpers/delete-all-data';
import { LikeStatus } from '../src/features/bloggers-platform/likes/domain/like.entity';
import { BlogsViewDto } from '../src/features/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { PostsViewDto } from '../src/features/bloggers-platform/posts/api/view-dto/posts.view-dto';

describe('Likes (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let postsTestManager: PostsTestManager;
  let commentsTestManager: CommentsTestManager;
  let usersTestManager: UsersTestManager;
  let blogsTestManager: BlogsTestManager;
  let accessToken: string;
  let blog: BlogsViewDto;
  let post: PostsViewDto;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    authTestManager = result.authTestManager;
    postsTestManager = result.postsTestManager;
    commentsTestManager = result.commentsTestManager;
    usersTestManager = result.usersTestManager;
    blogsTestManager = result.blogsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);

    // Create a user
    await usersTestManager.createUser({
      login: 'user1',
      password: 'password1',
      email: 'user1@example.com',
    });

    // Login to get access token
    const loginResponse = await authTestManager.login(
      {
        loginOrEmail: 'user1',
        password: 'password1',
      },
      HttpStatus.OK,
    );
    accessToken = loginResponse.body.accessToken;

    // Create a blog
    blog = await blogsTestManager.createBlog({
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test.com',
    });

    // Create a post
    post = await postsTestManager.createPost({
      title: 'Test Post',
      shortDescription: 'Test Description',
      content: 'Test Content',
      blogId: blog.id,
    });
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('PUT /posts/:id/like-status', () => {
    it('should update post like status to Like', async () => {
      // Update like status to Like
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        accessToken,
      );

      // Get post and verify like status
      const updatedPost = await postsTestManager.getPostById(post.id, accessToken);
      expect(updatedPost.extendedLikesInfo.likesCount).toBe(1);
      expect(updatedPost.extendedLikesInfo.myStatus).toBe(LikeStatus.Like);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Try to update like status without token
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        'invalid_token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should return 404 if post not found', async () => {
      // Try to update like status for non-existent post
      await postsTestManager.updatePostLikeStatus(
        'non-existent-id',
        { likeStatus: LikeStatus.Like },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('PUT /comments/:id/like-status', () => {
    let comment: any;

    beforeEach(async () => {
      // Create a comment
      comment = await postsTestManager.createComment(
        post.id,
        { content: 'This is a test comment that meets the length requirement.' },
        accessToken,
        HttpStatus.CREATED,
      );
    });

    it('should update comment like status to Like', async () => {
      // Update like status to Like
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        accessToken,
      );

      // Get comment and verify like status
      const updatedComment = await commentsTestManager.getCommentById(comment.id, accessToken);
      expect(updatedComment.likesInfo.likesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.Like);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Try to update like status without token
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        'invalid_token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should return 404 if comment not found', async () => {
      // Try to update like status for non-existent comment
      await commentsTestManager.updateCommentLikeStatus(
        'non-existent-id',
        { likeStatus: LikeStatus.Like },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should handle multiple users liking and changing status of a comment', async () => {
      // Create a comment on the post
      const comment = await postsTestManager.createComment(
        post.id,
        { content: 'This is a test comment that is long enough to meet the minimum length requirement.' },
        accessToken,
      );

      // First user likes the comment
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        accessToken,
      );

      // Create second user
      await usersTestManager.createUser({
        login: 'user2',
        password: 'password2',
        email: 'user2@example.com',
      });

      // Login as second user
      const user2LoginResponse = await authTestManager.login({
        loginOrEmail: 'user2',
        password: 'password2',
      });
      const user2AccessToken = user2LoginResponse.body.accessToken;

      // Second user dislikes the comment
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        user2AccessToken,
      );

      // Verify comment has 1 like and 1 dislike
      let updatedComment = await commentsTestManager.getCommentById(comment.id, user2AccessToken);
      expect(updatedComment.likesInfo.likesCount).toBe(1);
      expect(updatedComment.likesInfo.dislikesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.Dislike);

      // First user changes their like to None
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.None },
        accessToken,
      );

      // Verify final state: 0 likes, 1 dislike
      updatedComment = await commentsTestManager.getCommentById(comment.id, accessToken);
      expect(updatedComment.likesInfo.likesCount).toBe(0);
      expect(updatedComment.likesInfo.dislikesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.None);
    });
  });
});
