import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { PgPostsViewDto } from '../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto';

describe('Posts Controller (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let postsTestManager: PostsTestManager;
  let blogsTestManager: BlogsTestManager;
  let blogId: string;
  let validPost: CreatePostInputDto;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    httpServer = result.httpServer;
    postsTestManager = result.postsTestManager;
    blogsTestManager = result.blogsTestManager;

    // Clean database once before all tests
    await deleteAllData(app);

    // Create a single blog to be used across all tests
    const blog = await blogsTestManager.createBlog({
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test-blog.com',
    });
    blogId = blog.id;

    // Initialize validPost with the blogId
    validPost = {
      title: 'Test Post',
      shortDescription: 'Test Short Description',
      content: 'Test Content',
      blogId: blog.id,
    };
  });

  // Clean up posts before each mutation test
  beforeEach(async () => {
    // Get the current test title
    const testTitle = expect.getState().currentTestName;

    // Only clean data for mutation tests (POST, PUT, DELETE)
    if (
      testTitle?.includes('POST') ||
      testTitle?.includes('PUT') ||
      testTitle?.includes('DELETE')
    ) {
      await deleteAllData(app);
      // Recreate the blog since it was deleted
      const blog = await blogsTestManager.createBlog({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test-blog.com',
      });
      blogId = blog.id;
      validPost.blogId = blog.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /sa/blogs/:blogId/posts', () => {
    describe('successful creation', () => {
      it('should create post with valid data', async () => {
        const response = await postsTestManager.createPost(blogId, validPost);

        expect(response).toEqual({
          id: expect.any(String),
          title: validPost.title,
          shortDescription: validPost.shortDescription,
          content: validPost.content,
          blogId: validPost.blogId,
          blogName: expect.any(String),
          createdAt: expect.any(String),
          extendedLikesInfo: {
            dislikesCount: expect.any(Number),
            likesCount: expect.any(Number),
            myStatus: 'None',
            newestLikes: expect.any(Array),
          },
        });
      });
    });

    describe('authentication checks', () => {
      const authTests = [
        {
          name: 'without basic auth',
          login: '',
          password: '',
        },
        {
          name: 'with incorrect credentials',
          login: 'wrong',
          password: 'wrong',
        },
      ];

      test.each(authTests)(
        'should not create post $name',
        async ({ login, password }) => {
          await postsTestManager.createPost(
            blogId,
            validPost,
            HttpStatus.UNAUTHORIZED,
            login,
            password,
          );
        },
      );
    });

    describe('validation checks', () => {
      const validationTests = [
        {
          field: 'title',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(31), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
        {
          field: 'shortDescription',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(101), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
        {
          field: 'content',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(1001), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
      ];

      validationTests.forEach(({ field, cases }) => {
        describe(`${field} validation`, () => {
          test.each(cases)(
            `should not create post with $description ${field}`,
            async ({ value }) => {
              const invalidPost = { ...validPost, [field]: value };
              await postsTestManager.createPost(
                blogId,
                invalidPost,
                HttpStatus.BAD_REQUEST,
              );
            },
          );
        });
      });
    });

    it('should not create post with non-existent blogId', async () => {
      await postsTestManager.createPost(
        'non-existent-id',
        validPost,
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('GET /posts', () => {
    it('should return empty list when no posts exist', async () => {
      const response = await request(httpServer)
        .get(`/${PATHS.POSTS}`)
        .expect(HttpStatus.OK);

      const expectedResponse: PaginatedViewDto<PgPostsViewDto[]> = {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      };

      expect(response.body).toEqual(expectedResponse);
    });

    it('should return list of posts with pagination', async () => {
      const posts = await postsTestManager.createSeveralPosts(blogId, 3);

      const response = await request(httpServer)
        .get(`/${PATHS.POSTS}`)
        .expect(HttpStatus.OK);

      expect(response.body.items).toHaveLength(3);
      expect(response.body.totalCount).toBe(3);
      // Verify posts are returned in reverse chronological order (newest first)
      for (let i = 0; i < posts.length; i++) {
        expect(response.body.items[i]).toMatchObject({
          title: posts[posts.length - 1 - i].title,
          shortDescription: posts[posts.length - 1 - i].shortDescription,
          content: posts[posts.length - 1 - i].content,
          blogId: posts[posts.length - 1 - i].blogId,
          blogName: posts[posts.length - 1 - i].blogName,
        });
      }
    });
  });

  describe('GET /posts/:id', () => {
    it('should return post by id', async () => {
      const post = await postsTestManager.createPost(blogId, validPost);

      const response = await request(httpServer)
        .get(`/${PATHS.POSTS}/${post.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(post);
    });

    it('should return 404 for non-existent post', async () => {
      await request(httpServer)
        .get(`/${PATHS.POSTS}/non-existent-id`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /sa/blogs/:blogId/posts/:id', () => {
    const updateDto: UpdatePostInputDto = {
      title: 'Updated Post',
      shortDescription: 'Updated Short Description',
      content: 'Updated Content',
    };

    describe('successful update', () => {
      it('should update post with valid data', async () => {
        const post = await postsTestManager.createPost(blogId, validPost);
        await postsTestManager.updatePost(blogId, post.id, updateDto);

        const response = await request(httpServer)
          .get(`/${PATHS.POSTS}/${post.id}`)
          .expect(HttpStatus.OK);

        expect(response.body).toEqual({
          id: post.id,
          title: updateDto.title,
          shortDescription: updateDto.shortDescription,
          content: updateDto.content,
          blogId: post.blogId,
          blogName: expect.any(String),
          createdAt: expect.any(String),
          extendedLikesInfo: {
            dislikesCount: expect.any(Number),
            likesCount: expect.any(Number),
            myStatus: 'None',
            newestLikes: expect.any(Array),
          },
        });
      });
    });

    describe('authentication checks', () => {
      const authTests = [
        {
          name: 'without basic auth',
          login: '',
          password: '',
        },
        {
          name: 'with incorrect credentials',
          login: 'wrong',
          password: 'wrong',
        },
      ];

      test.each(authTests)(
        'should not update post $name',
        async ({ login, password }) => {
          const post = await postsTestManager.createPost(blogId, validPost);
          await postsTestManager.updatePost(
            blogId,
            post.id,
            updateDto,
            HttpStatus.UNAUTHORIZED,
            login,
            password,
          );
        },
      );
    });

    describe('validation checks', () => {
      const validationTests = [
        {
          field: 'title',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(31), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
        {
          field: 'shortDescription',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(101), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
        {
          field: 'content',
          cases: [
            { value: '', description: 'empty' },
            { value: 'a'.repeat(1001), description: 'too long' },
            { value: '   ', description: 'whitespace' },
          ],
        },
      ];

      validationTests.forEach(({ field, cases }) => {
        describe(`${field} validation`, () => {
          test.each(cases)(
            `should not update post with $description ${field}`,
            async ({ value }) => {
              const post = await postsTestManager.createPost(blogId, validPost);
              const invalidUpdate = { ...updateDto, [field]: value };
              await postsTestManager.updatePost(
                blogId,
                post.id,
                invalidUpdate,
                HttpStatus.BAD_REQUEST,
              );
            },
          );
        });
      });
    });

    it('should not update non-existent post', async () => {
      await postsTestManager.updatePost(
        blogId,
        'non-existent-id',
        updateDto,
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('DELETE /sa/blogs/:blogId/posts/:id', () => {
    describe('successful deletion', () => {
      it('should delete post with valid id', async () => {
        const post = await postsTestManager.createPost(blogId, validPost);
        await postsTestManager.deletePost(blogId, post.id);
      });
    });

    describe('authentication checks', () => {
      const authTests = [
        {
          name: 'without basic auth',
          login: '',
          password: '',
        },
        {
          name: 'with incorrect credentials',
          login: 'wrong',
          password: 'wrong',
        },
      ];

      test.each(authTests)(
        'should not delete post $name',
        async ({ login, password }) => {
          const post = await postsTestManager.createPost(blogId, validPost);
          await postsTestManager.deletePost(
            blogId,
            post.id,
            HttpStatus.UNAUTHORIZED,
            login,
            password,
          );
        },
      );
    });

    it('should not delete non-existent post', async () => {
      await postsTestManager.deletePost(
        blogId,
        'non-existent-id',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
