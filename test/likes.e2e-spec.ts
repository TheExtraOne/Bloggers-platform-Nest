import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { AuthTestManager } from './helpers/managers/auth-test-manager';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { CommentsTestManager } from './helpers/managers/comments-test-manager';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { deleteAllData } from './helpers/delete-all-data';
import { PgBlogsViewDto } from '../src/modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { PgPostsViewDto } from '../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { LikeStatus } from '../src/modules/bloggers-platform/likes/domain/enums/like-status.enum';

describe('Likes (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;
  let postsTestManager: PostsTestManager;
  let commentsTestManager: CommentsTestManager;
  let usersTestManager: UsersTestManager;
  let blogsTestManager: BlogsTestManager;
  let accessToken: string;
  let user2AccessToken: string;
  let blog: PgBlogsViewDto;
  let post: PgPostsViewDto;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    authTestManager = result.authTestManager;
    postsTestManager = result.postsTestManager;
    commentsTestManager = result.commentsTestManager;
    usersTestManager = result.usersTestManager;
    blogsTestManager = result.blogsTestManager;

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
    post = await postsTestManager.createPost(blog.id, {
      title: 'Test Post',
      shortDescription: 'Test Description',
      content: 'Test Content',
    });

    // Create second user and get token for tests
    await usersTestManager.createUser({
      login: 'user2',
      password: 'password2',
      email: 'user2@example.com',
    });

    const user2LoginResponse = await authTestManager.login({
      loginOrEmail: 'user2',
      password: 'password2',
    });
    user2AccessToken = user2LoginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PUT /posts/:id/like-status', () => {
    it('should handle post like status operations correctly', async () => {
      // First user likes the post
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        accessToken,
      );

      // Verify like is recorded
      let updatedPost = await postsTestManager.getPostById(
        post.id,
        accessToken,
      );
      expect(updatedPost.extendedLikesInfo.likesCount).toBe(1);
      expect(updatedPost.extendedLikesInfo.myStatus).toBe(LikeStatus.Like);

      // Second user dislikes
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Dislike },
        user2AccessToken,
      );

      // Verify both like and dislike are recorded
      updatedPost = await postsTestManager.getPostById(
        post.id,
        user2AccessToken,
      );
      expect(updatedPost.extendedLikesInfo.likesCount).toBe(1);
      expect(updatedPost.extendedLikesInfo.dislikesCount).toBe(1);
      expect(updatedPost.extendedLikesInfo.myStatus).toBe(LikeStatus.Dislike);

      // First user removes like
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.None },
        accessToken,
      );

      // Verify final state
      updatedPost = await postsTestManager.getPostById(post.id, accessToken);
      expect(updatedPost.extendedLikesInfo.likesCount).toBe(0);
      expect(updatedPost.extendedLikesInfo.dislikesCount).toBe(1);
      expect(updatedPost.extendedLikesInfo.myStatus).toBe(LikeStatus.None);
    });

    it('should handle error cases', async () => {
      // Test unauthorized access
      await postsTestManager.updatePostLikeStatus(
        post.id,
        { likeStatus: LikeStatus.Like },
        'invalid_token',
        HttpStatus.UNAUTHORIZED,
      );

      // Test non-existent post
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

    beforeAll(async () => {
      // Create a comment once for all tests
      comment = await postsTestManager.createComment(
        post.id,
        {
          content: 'This is a test comment that meets the length requirement.',
        },
        accessToken,
        HttpStatus.CREATED,
      );
    });

    it('should handle like status operations correctly', async () => {
      // First user likes the comment
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        accessToken,
      );

      // Verify like is recorded
      let updatedComment = await commentsTestManager.getCommentById(
        comment.id,
        accessToken,
      );
      expect(updatedComment.likesInfo.likesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.Like);

      // Second user dislikes
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Dislike },
        user2AccessToken,
      );

      // Verify both like and dislike are recorded
      updatedComment = await commentsTestManager.getCommentById(
        comment.id,
        user2AccessToken,
      );
      expect(updatedComment.likesInfo.likesCount).toBe(1);
      expect(updatedComment.likesInfo.dislikesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.Dislike);

      // First user removes like
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.None },
        accessToken,
      );

      // Verify final state
      updatedComment = await commentsTestManager.getCommentById(
        comment.id,
        accessToken,
      );
      expect(updatedComment.likesInfo.likesCount).toBe(0);
      expect(updatedComment.likesInfo.dislikesCount).toBe(1);
      expect(updatedComment.likesInfo.myStatus).toBe(LikeStatus.None);
    });

    it('should return 401 if user is not authenticated', async () => {
      await commentsTestManager.updateCommentLikeStatus(
        comment.id,
        { likeStatus: LikeStatus.Like },
        'invalid_token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should return 404 if comment not found', async () => {
      await commentsTestManager.updateCommentLikeStatus(
        'non-existent-id',
        { likeStatus: LikeStatus.Like },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
