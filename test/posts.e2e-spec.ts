import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { TestSettingsInitializer } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import { PostsTestManager } from './helpers/managers/posts-test-manager';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { PostsViewDto } from '../src/features/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../src/features/bloggers-platform/posts/api/input-dto/posts.input-dto';

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
  });

  beforeEach(async () => {
    await deleteAllData(app);
    // Create a blog for testing posts
    const blog = await blogsTestManager.createBlog({
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test-blog.com',
    });
    blogId = blog.id;
    // Initialize validPost with the new blogId
    validPost = {
      title: 'Test Post',
      shortDescription: 'Test Short Description',
      content: 'Test Content',
      blogId: blog.id,
    };
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /posts', () => {
    it('should create post with valid data', async () => {
      const response = await postsTestManager.createPost(validPost);

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

    it('should not create post without basic auth', async () => {
      await postsTestManager.createPost(
        validPost,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should not create post with incorrect credentials', async () => {
      await postsTestManager.createPost(
        validPost,
        HttpStatus.UNAUTHORIZED,
        'wrong',
        'wrong',
      );
    });

    describe('title validation', () => {
      it('should not create post with empty title', async () => {
        const invalidPost = { ...validPost, title: '' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with too long title', async () => {
        const invalidPost = { ...validPost, title: 'a'.repeat(31) }; // max length is 30
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with whitespace title', async () => {
        const invalidPost = { ...validPost, title: '   ' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });
    });

    describe('shortDescription validation', () => {
      it('should not create post with empty shortDescription', async () => {
        const invalidPost = { ...validPost, shortDescription: '' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with too long shortDescription', async () => {
        const invalidPost = { ...validPost, shortDescription: 'a'.repeat(101) }; // max length is 100
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with whitespace shortDescription', async () => {
        const invalidPost = { ...validPost, shortDescription: '   ' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });
    });

    describe('content validation', () => {
      it('should not create post with empty content', async () => {
        const invalidPost = { ...validPost, content: '' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with too long content', async () => {
        const invalidPost = { ...validPost, content: 'a'.repeat(1001) }; // max length is 1000
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });

      it('should not create post with whitespace content', async () => {
        const invalidPost = { ...validPost, content: '   ' };
        await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
      });
    });

    it('should not create post with non-existent blogId', async () => {
      const invalidPost = { ...validPost, blogId: 'non-existent-id' };
      await postsTestManager.createPost(invalidPost, HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /posts', () => {
    it('should return empty list when no posts exist', async () => {
      const response = await request(httpServer)
        .get(`/${PATHS.POSTS}`)
        .expect(HttpStatus.OK);

      const expectedResponse: PaginatedViewDto<PostsViewDto[]> = {
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
      const post = await postsTestManager.createPost(validPost);

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

  describe('PUT /posts/:id', () => {
    let updateDto: UpdatePostInputDto;

    beforeEach(() => {
      updateDto = {
        title: 'Updated Post',
        shortDescription: 'Updated Short Description',
        content: 'Updated Content',
        blogId: blogId,
      };
    });

    it('should update post with valid data', async () => {
      const post = await postsTestManager.createPost(validPost);
      await postsTestManager.updatePost(post.id, updateDto);

      // Verify the post was updated
      const response = await request(httpServer)
        .get(`/${PATHS.POSTS}/${post.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: post.id,
        title: updateDto.title,
        shortDescription: updateDto.shortDescription,
        content: updateDto.content,
        blogId: updateDto.blogId,
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

    it('should not update post without basic auth', async () => {
      const post = await postsTestManager.createPost(validPost);

      await postsTestManager.updatePost(
        post.id,
        updateDto,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should not update post with incorrect credentials', async () => {
      const post = await postsTestManager.createPost(validPost);

      await postsTestManager.updatePost(
        post.id,
        updateDto,
        HttpStatus.UNAUTHORIZED,
        'wrong',
        'wrong',
      );
    });

    // Add similar validation tests as in POST /posts
  });

  describe('DELETE /posts/:id', () => {
    it('should delete post with valid id', async () => {
      const post = await postsTestManager.createPost(validPost);
      await postsTestManager.deletePost(post.id);
    });

    it('should not delete post without basic auth', async () => {
      const post = await postsTestManager.createPost(validPost);
      await postsTestManager.deletePost(
        post.id,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should not delete post with incorrect credentials', async () => {
      const post = await postsTestManager.createPost(validPost);
      await postsTestManager.deletePost(
        post.id,
        HttpStatus.UNAUTHORIZED,
        'wrong',
        'wrong',
      );
    });
  });
});
