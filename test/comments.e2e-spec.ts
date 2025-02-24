import { INestApplication } from '@nestjs/common';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { CommentsTestManager } from './helpers/managers/comments-test-manager';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { CreateBlogInputDto } from '../src/features/bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { CreatePostInputDto } from '../src/features/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { CreateCommentInputDto } from '../src/features/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { UpdateCommentInputDto } from '../src/features/bloggers-platform/comments/api/input-dto/comment.input.dto';
import { CreateUserInputDto } from '../src/features/user-accounts/users/api/input-dto/users.input-dto';
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

  let validBlog: CreateBlogInputDto;
  let validPost: CreatePostInputDto;
  let validComment: CreateCommentInputDto;
  let validUpdateComment: UpdateCommentInputDto;
  let accessToken: string;
  let createdBlogId: string;
  let createdPostId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    commentsTestManager = result.commentsTestManager;
    postsTestManager = result.postsTestManager;
    blogsTestManager = result.blogsTestManager;
    userTestManager = result.usersTestManager;
    authTestManager = result.authTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
    // Create test data

    // Create a user and get access token
    const userDto: CreateUserInputDto = {
      login: 'testuser',
      password: 'password123',
      email: 'test@test.com',
    };
    await userTestManager.createUser(userDto);

    const loginResponse = await authTestManager.login(
      {
        loginOrEmail: userDto.login,
        password: userDto.password,
      },
      HttpStatus.OK,
    );
    accessToken = loginResponse.body.accessToken;

    // Create a blog
    validBlog = {
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test.com',
    };
    const blogResponse = await blogsTestManager.createBlog(
      validBlog,
      HttpStatus.CREATED,
    );
    createdBlogId = blogResponse.id;

    // Create a post
    validPost = {
      title: 'Test Post',
      shortDescription: 'Test Short Description',
      content: 'Test Content',
      blogId: createdBlogId,
    };
    const postResponse = await postsTestManager.createPost(validPost);
    createdPostId = postResponse.id;

    validComment = {
      content: 'This is a valid comment with required length',
    };

    validUpdateComment = {
      content: 'This is an updated comment with required length',
    };

    // Create a comment for post
    const commentResponse = await postsTestManager.createComment(
      createdPostId,
      validComment,
      accessToken,
    );
    createdCommentId = commentResponse.id;
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /posts/:id/comments', () => {
    it('should create a comment for a post', async () => {
      const newComment: CreateCommentInputDto = {
        content: 'New test comment with some content',
      };

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
    });

    it('should return 400 if content is invalid', async () => {
      // Empty content
      const emptyComment = { content: '' };
      await postsTestManager.createComment(
        createdPostId,
        emptyComment,
        accessToken,
        400,
      );

      // Too short content
      const tooShortComment = { content: 'ab' };
      await postsTestManager.createComment(
        createdPostId,
        tooShortComment,
        accessToken,
        400,
      );

      // Too long content
      const tooLongComment = { content: 'a'.repeat(1001) };
      await postsTestManager.createComment(
        createdPostId,
        tooLongComment,
        accessToken,
        400,
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      await postsTestManager.createComment(
        createdPostId,
        validComment,
        'invalid_token',
        401,
      );
    });

    it('should return 404 if post not found', async () => {
      await postsTestManager.createComment(
        '507f1f77bcf86cd799439011',
        validComment,
        accessToken,
        404,
      );
    });
  });

  describe('GET /posts/:id/comments', () => {
    it('should get all comments for a post', async () => {
      const response = await postsTestManager.getPostComments(createdPostId);

      expect(response).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: [
          {
            id: expect.any(String),
            content: expect.any(String),
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
          },
        ],
      });
    });

    it('should return 404 if post not found', async () => {
      await postsTestManager.getPostComments(
        '507f1f77bcf86cd799439011',
        {},
        404,
      );
    });

    it('should return empty items array if post has no comments', async () => {
      // Create a new post without comments
      const newPostResponse = await postsTestManager.createPost({
        title: 'Post without comments',
        shortDescription: 'Test Description',
        content: 'Test Content',
        blogId: createdBlogId,
      });

      const response = await postsTestManager.getPostComments(
        newPostResponse.id,
      );

      expect(response).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should paginate comments correctly', async () => {
      // Create 15 comments
      for (let i = 0; i < 15; i++) {
        await postsTestManager.createComment(
          createdPostId,
          { content: `Comment ${i + 1} with some content` },
          accessToken,
        );
      }

      // Get first page (10 items)
      const firstPage = await postsTestManager.getPostComments(createdPostId, {
        pageNumber: 1,
        pageSize: 10,
      });
      expect(firstPage.items.length).toBe(10);
      expect(firstPage.page).toBe(1);
      expect(firstPage.totalCount).toBe(16); // 15 new + 1 initial

      // Get second page (6 items)
      const secondPage = await postsTestManager.getPostComments(createdPostId, {
        pageNumber: 2,
        pageSize: 10,
      });
      expect(secondPage.items.length).toBe(6);
      expect(secondPage.page).toBe(2);
      expect(secondPage.totalCount).toBe(16);
    });
  });

  describe('GET /comments/:id', () => {
    it('should get comment by id', async () => {
      const response = await commentsTestManager.getCommentById(
        createdCommentId,
        accessToken,
      );
      expect(response).toEqual({
        id: expect.any(String),
        content: validComment.content,
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
    });

    it('should return 404 if comment not found', async () => {
      await commentsTestManager.getCommentById(
        '507f1f77bcf86cd799439011',
        accessToken,
        404,
      );
    });
  });

  describe('PUT /comments/:id', () => {
    it('should update comment', async () => {
      await commentsTestManager.updateComment(
        createdCommentId,
        validUpdateComment,
        accessToken,
      );

      const updatedComment = await commentsTestManager.getCommentById(
        createdCommentId,
        accessToken,
      );
      expect(updatedComment.content).toBe(validUpdateComment.content);
    });

    it('should return 400 if content is invalid', async () => {
      const invalidComment = { content: '' }; // Empty content
      await commentsTestManager.updateComment(
        createdCommentId,
        invalidComment,
        accessToken,
        400,
      );

      // Try with too short content
      const tooShortComment = { content: 'ab' };
      await commentsTestManager.updateComment(
        createdCommentId,
        tooShortComment,
        accessToken,
        400,
      );

      // Try with too long content
      const tooLongComment = { content: 'a'.repeat(1001) };
      await commentsTestManager.updateComment(
        createdCommentId,
        tooLongComment,
        accessToken,
        400,
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      await commentsTestManager.updateComment(
        createdCommentId,
        validUpdateComment,
        'invalid_token',
        401,
      );
    });

    it('should return 403 if user is not the owner', async () => {
      // Create another user
      const anotherUserDto: CreateUserInputDto = {
        login: 'another',
        password: 'password123',
        email: 'another2@test.com',
      };
      await userTestManager.createUser(anotherUserDto);

      const anotherUserLogin = await authTestManager.login(
        {
          loginOrEmail: anotherUserDto.login,
          password: anotherUserDto.password,
        },
        HttpStatus.OK,
      );

      await commentsTestManager.updateComment(
        createdCommentId,
        validUpdateComment,
        anotherUserLogin.body.accessToken,
        403,
      );
    });

    it('should return 404 if comment not found', async () => {
      await commentsTestManager.updateComment(
        '507f1f77bcf86cd799439011',
        validUpdateComment,
        accessToken,
        404,
      );
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete comment', async () => {
      await commentsTestManager.deleteComment(createdCommentId, accessToken);
      await commentsTestManager.getCommentById(
        createdCommentId,
        accessToken,
        404,
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      await commentsTestManager.deleteComment(
        createdCommentId,
        'invalid_token',
        401,
      );
    });

    it('should return 403 if user is not the owner', async () => {
      // Create another user
      const anotherUserDto: CreateUserInputDto = {
        login: 'another10',
        password: 'password123',
        email: 'another10@test.com',
      };
      await userTestManager.createUser(anotherUserDto);

      // Login as another user
      const anotherUserLogin = await authTestManager.login(
        {
          loginOrEmail: anotherUserDto.login,
          password: anotherUserDto.password,
        },
        HttpStatus.OK,
      );

      await commentsTestManager.deleteComment(
        createdCommentId,
        anotherUserLogin.body.accessToken,
        403,
      );
    });

    it('should return 404 if comment not found', async () => {
      await commentsTestManager.deleteComment(
        '507f1f77bcf86cd799439011',
        accessToken,
        404,
      );
    });
  });
});
