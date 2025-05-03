import { INestApplication } from '@nestjs/common';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { CommentsTestManager } from './helpers/managers/comments-test-manager';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { CreateBlogInputDto } from '../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { CreateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { UpdateCommentInputDto } from '../src/modules/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { CreateUserInputDto } from '../src/modules/user-accounts/users/api/input-dto/users.input-dto';
import { HttpStatus } from '@nestjs/common';
import { UsersTestManager } from './helpers/managers/users-test-manager';
import { AuthTestManager } from './helpers/managers/auth-test-manager';

describe('Comments Controller (e2e)', () => {
  let app: INestApplication;
  let commentsTestManager: CommentsTestManager;
  let postsTestManager: PostsTestManager;
  let blogsTestManager: BlogsTestManager;
  let userTestManager: UsersTestManager;
  let authTestManager: AuthTestManager;

  // Reusable test data
  const testUser: CreateUserInputDto = {
    login: 'testuser',
    password: 'password123',
    email: 'test@test.com',
  };

  const validBlog: CreateBlogInputDto = {
    name: 'Test Blog',
    description: 'Test Description',
    websiteUrl: 'https://test.com',
  };

  const validPost: CreatePostInputDto = {
    title: 'Test Post',
    shortDescription: 'Test Short Description',
    content: 'Test Content',
    blogId: '', // Will be set when blog is created
  };

  const validComment: CreateCommentInputDto = {
    content: 'This is a valid comment with required length',
  };

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    commentsTestManager = result.commentsTestManager;
    postsTestManager = result.postsTestManager;
    blogsTestManager = result.blogsTestManager;
    userTestManager = result.usersTestManager;
    authTestManager = result.authTestManager;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Comments CRUD operations', () => {
    let accessToken: string;
    let createdBlogId: string;
    let createdPostId: string;
    let createdCommentId: string;

    beforeAll(async () => {
      await deleteAllData(app);

      // Setup test data once for all tests
      await userTestManager.createUser(testUser);
      const loginResponse = await authTestManager.login(
        {
          loginOrEmail: testUser.login,
          password: testUser.password,
        },
        HttpStatus.OK,
      );
      accessToken = loginResponse.body.accessToken;

      const blogResponse = await blogsTestManager.createBlog(
        validBlog,
        HttpStatus.CREATED,
      );
      createdBlogId = blogResponse.id;

      validPost.blogId = createdBlogId;
      const postResponse = await postsTestManager.createPost(
        createdBlogId,
        validPost,
      );
      createdPostId = postResponse.id;

      const commentResponse = await postsTestManager.createComment(
        createdPostId,
        validComment,
        accessToken,
      );
      createdCommentId = commentResponse.id;
    });

    describe('Comment Creation and Validation', () => {
      it('should handle comment creation with various content validations', async () => {
        // Valid comment creation
        const newComment = { content: 'New test comment with some content' };
        const response = await postsTestManager.createComment(
          createdPostId,
          newComment,
          accessToken,
        );
        expect(response).toEqual({
          id: expect.any(String),
          content: newComment.content,
          commentatorInfo: {
            userId: expect.any(String),
            userLogin: expect.any(String),
          },
          createdAt: expect.any(String),
          likesInfo: {
            likesCount: expect.any(Number),
            dislikesCount: expect.any(Number),
            myStatus: 'None',
          },
        });

        // Invalid content validations
        const invalidCases = [
          { content: '' }, // Empty
          { content: 'ab' }, // Too short
          { content: 'a'.repeat(1001) }, // Too long
        ];

        for (const invalidComment of invalidCases) {
          await postsTestManager.createComment(
            createdPostId,
            invalidComment,
            accessToken,
            400,
          );
        }
      });

      it('should handle authentication and not found scenarios', async () => {
        // Authentication check
        await postsTestManager.createComment(
          createdPostId,
          validComment,
          'invalid_token',
          401,
        );

        // Not found check
        await postsTestManager.createComment(
          '507f1f77bcf86cd799439011',
          validComment,
          accessToken,
          404,
        );
      });
    });

    describe('Comment Retrieval', () => {
      it('should handle comment retrieval with pagination', async () => {
        // Create multiple comments in batch
        const commentPromises = Array(3)
          .fill(null)
          .map((_, i) =>
            postsTestManager.createComment(
              createdPostId,
              { content: `Comment ${i + 1} with some content` },
              accessToken,
            ),
          );
        await Promise.all(commentPromises);

        // Test pagination in single request
        const paginatedResponse = await postsTestManager.getPostComments(
          createdPostId,
          {
            pageNumber: 1,
            pageSize: 2,
          },
        );

        expect(paginatedResponse).toEqual({
          pagesCount: expect.any(Number),
          page: 1,
          pageSize: 2,
          totalCount: 5, // 3 new + 1 initial + 1 from previous test
          items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              content: expect.any(String),
            }),
          ]),
        });
      });

      it('should handle comment retrieval edge cases', async () => {
        // Not found case
        await postsTestManager.getPostComments(
          '507f1f77bcf86cd799439011',
          {},
          404,
        );

        // Empty comments case
        validPost.title = 'Post without comments';
        const newPostResponse = await postsTestManager.createPost(
          createdBlogId,
          validPost,
        );

        const emptyResponse = await postsTestManager.getPostComments(
          newPostResponse.id,
        );
        expect(emptyResponse.items).toHaveLength(0);
      });
    });

    describe('Comment Updates and Deletion', () => {
      it('should handle comment updates with proper authorization', async () => {
        const updateContent: UpdateCommentInputDto = {
          content: 'Updated comment content here',
        };

        // Successful update
        await commentsTestManager.updateComment(
          createdCommentId,
          updateContent,
          accessToken,
        );

        const updatedComment = await commentsTestManager.getCommentById(
          createdCommentId,
          accessToken,
        );
        expect(updatedComment.content).toBe(updateContent.content);

        // Create another user for authorization tests
        const anotherUser: CreateUserInputDto = {
          login: 'another',
          password: 'password123',
          email: 'another@test.com',
        };
        await userTestManager.createUser(anotherUser);
        const anotherUserLogin = await authTestManager.login(
          {
            loginOrEmail: anotherUser.login,
            password: anotherUser.password,
          },
          HttpStatus.OK,
        );

        // Forbidden update
        await commentsTestManager.updateComment(
          createdCommentId,
          updateContent,
          anotherUserLogin.body.accessToken,
          403,
        );
      });

      it('should handle comment deletion with proper authorization', async () => {
        // Create a comment for deletion
        const commentToDelete = await postsTestManager.createComment(
          createdPostId,
          validComment,
          accessToken,
        );

        // Successful deletion
        await commentsTestManager.deleteComment(
          commentToDelete.id,
          accessToken,
        );
        await commentsTestManager.getCommentById(
          commentToDelete.id,
          accessToken,
          404,
        );

        // Not found case
        await commentsTestManager.deleteComment(
          '507f1f77bcf86cd799439011',
          accessToken,
          404,
        );

        // Unauthorized deletion
        await commentsTestManager.deleteComment(
          createdCommentId,
          'invalid_token',
          401,
        );
      });
    });
  });
});
