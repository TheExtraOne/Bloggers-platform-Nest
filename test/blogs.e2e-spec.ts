import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { stopMongoMemoryServer } from './helpers/mongodb-memory-server';
import { deleteAllData } from './helpers/delete-all-data';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../src/features/bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { BlogsViewDto } from '../src/features/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { CreatePostInputDto } from '../src/features/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { PostsViewDto } from '../src/features/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { TestSettingsInitializer } from './helpers/init-settings';

describe('Blogs Controller (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let blogsTestManager: BlogsTestManager;

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    httpServer = result.httpServer;
    blogsTestManager = result.blogsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
    await stopMongoMemoryServer();
  });

  describe('POST /blogs', () => {
    const validBlog: CreateBlogInputDto = {
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test-blog.com',
    };

    it('should create blog with valid data', async () => {
      const response = await blogsTestManager.createBlog(validBlog);

      expect(response).toEqual({
        id: expect.any(String),
        name: validBlog.name,
        description: validBlog.description,
        websiteUrl: validBlog.websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });
    });

    it('should not create blog without basic auth', async () => {
      await blogsTestManager.createBlog(
        validBlog,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should not create blog with incorrect credentials', async () => {
      await blogsTestManager.createBlog(
        validBlog,
        HttpStatus.UNAUTHORIZED,
        'wrong',
        'wrong',
      );
    });

    describe('name validation', () => {
      it('should not create blog with empty name', async () => {
        const invalidBlog = { ...validBlog, name: '' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with too long name', async () => {
        const invalidBlog = { ...validBlog, name: 'a'.repeat(16) }; // max length is 15
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with whitespace name', async () => {
        const invalidBlog = { ...validBlog, name: '   ' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });
    });

    describe('description validation', () => {
      it('should not create blog with empty description', async () => {
        const invalidBlog = { ...validBlog, description: '' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with too long description', async () => {
        const invalidBlog = { ...validBlog, description: 'a'.repeat(501) }; // max length is 500
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with whitespace description', async () => {
        const invalidBlog = { ...validBlog, description: '   ' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });
    });

    describe('websiteUrl validation', () => {
      it('should not create blog with invalid url format', async () => {
        const invalidBlog = { ...validBlog, websiteUrl: 'invalid-url' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with too long url', async () => {
        const invalidBlog = {
          ...validBlog,
          websiteUrl: `https://${'a'.repeat(95)}.com`,
        }; // max length is 100
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with empty url', async () => {
        const invalidBlog = { ...validBlog, websiteUrl: '' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });

      it('should not create blog with whitespace url', async () => {
        const invalidBlog = { ...validBlog, websiteUrl: '   ' };
        await blogsTestManager.createBlog(invalidBlog, HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET /blogs', () => {
    it('should return empty list when no blogs exist', async () => {
      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should return paginated list of blogs', async () => {
      // Create 5 blogs
      await blogsTestManager.createSeveralBlogs(5);

      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}?pageSize=3&pageNumber=2`)
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<BlogsViewDto[]>;
      expect(body.items).toHaveLength(2); // Second page should have 2 items
      expect(body.totalCount).toBe(5);
      expect(body.pagesCount).toBe(2);
      expect(body.page).toBe(2);
      expect(body.pageSize).toBe(3);
    });

    it('should search blogs by name term', async () => {
      // Create blogs with different names
      await blogsTestManager.createBlog({
        name: 'First Blog',
        description: 'Test Description',
        websiteUrl: 'https://first-blog.com',
      });
      await blogsTestManager.createBlog({
        name: 'Second Blog',
        description: 'Test Description',
        websiteUrl: 'https://second-blog.com',
      });

      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}?searchNameTerm=First`)
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<BlogsViewDto[]>;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].name).toBe('First Blog');
    });
  });

  describe('GET /blogs/:id', () => {
    it('should return blog by id', async () => {
      const blog = await blogsTestManager.createBlog({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test-blog.com',
      });

      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}/${blog.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(blog);
    });

    it('should return 404 for non-existing blog', async () => {
      await request(httpServer)
        .get(`/${PATHS.BLOGS}/nonexistentid`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /blogs/:id', () => {
    const validBlog: CreateBlogInputDto = {
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test-blog.com',
    };

    it('should update existing blog', async () => {
      const blog = await blogsTestManager.createBlog(validBlog);

      const updateDto: UpdateBlogInputDto = {
        name: 'Updated Blog',
        description: 'Updated Description',
        websiteUrl: 'https://updated-blog.com',
      };

      await blogsTestManager.updateBlog(blog.id, updateDto);

      // Verify the update
      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}/${blog.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...blog,
        name: updateDto.name,
        description: updateDto.description,
        websiteUrl: updateDto.websiteUrl,
      });
    });

    it('should not update blog without basic auth', async () => {
      const blog = await blogsTestManager.createBlog(validBlog);
      const updateDto: UpdateBlogInputDto = {
        name: 'Updated Blog',
        description: 'Updated Description',
        websiteUrl: 'https://updated-blog.com',
      };

      await blogsTestManager.updateBlog(
        blog.id,
        updateDto,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should return 404 when updating non-existing blog', async () => {
      const updateDto: UpdateBlogInputDto = {
        name: 'Updated Blog',
        description: 'Updated Description',
        websiteUrl: 'https://updated-blog.com',
      };

      await blogsTestManager.updateBlog(
        'nonexistentid',
        updateDto,
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('DELETE /blogs/:id', () => {
    const validBlog: CreateBlogInputDto = {
      name: 'Test Blog',
      description: 'Test Description',
      websiteUrl: 'https://test-blog.com',
    };

    it('should delete existing blog', async () => {
      const blog = await blogsTestManager.createBlog(validBlog);

      await blogsTestManager.deleteBlog(blog.id);

      // Verify the blog is deleted
      await request(httpServer)
        .get(`/${PATHS.BLOGS}/${blog.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should not delete blog without basic auth', async () => {
      const blog = await blogsTestManager.createBlog(validBlog);
      await blogsTestManager.deleteBlog(
        blog.id,
        HttpStatus.UNAUTHORIZED,
        '',
        '',
      );
    });

    it('should return 404 when deleting non-existing blog', async () => {
      await blogsTestManager.deleteBlog('nonexistentid', HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /blogs/:id/posts', () => {
    const validPost: Omit<CreatePostInputDto, 'blogId'> = {
      title: 'Test Post',
      shortDescription: 'Test Short Description',
      content: 'Test Content',
    };

    it('should create post for existing blog', async () => {
      const blog = await blogsTestManager.createBlog({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test-blog.com',
      });

      const response = await blogsTestManager.createPost(blog.id, validPost);

      expect(response).toEqual({
        id: expect.any(String),
        title: validPost.title,
        shortDescription: validPost.shortDescription,
        content: validPost.content,
        blogId: blog.id,
        blogName: blog.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          dislikesCount: expect.any(Number),
          likesCount: expect.any(Number),
          myStatus: 'None',
          newestLikes: expect.any(Array),
        },
      });
    });

    it('should return 404 when creating post for non-existing blog', async () => {
      await blogsTestManager.createPost(
        'nonexistentid',
        validPost,
        HttpStatus.NOT_FOUND,
      );
    });

    describe('post validation', () => {
      let blogId: string;

      beforeEach(async () => {
        const blog = await blogsTestManager.createBlog({
          name: 'Test Blog',
          description: 'Test Description',
          websiteUrl: 'https://test-blog.com',
        });
        blogId = blog.id;
      });

      it('should not create post with empty title', async () => {
        const invalidPost = { ...validPost, title: '' };
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should not create post with too long title', async () => {
        const invalidPost = { ...validPost, title: 'a'.repeat(31) }; // max length is 30
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should not create post with empty shortDescription', async () => {
        const invalidPost = { ...validPost, shortDescription: '' };
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should not create post with too long shortDescription', async () => {
        const invalidPost = {
          ...validPost,
          shortDescription: 'a'.repeat(101),
        }; // max length is 100
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should not create post with empty content', async () => {
        const invalidPost = { ...validPost, content: '' };
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should not create post with too long content', async () => {
        const invalidPost = {
          ...validPost,
          content: 'a'.repeat(1001),
        }; // max length is 1000
        await blogsTestManager.createPost(
          blogId,
          invalidPost,
          HttpStatus.BAD_REQUEST,
        );
      });
    });
  });

  describe('GET /blogs/:id/posts', () => {
    it('should return empty list when blog has no posts', async () => {
      const blog = await blogsTestManager.createBlog({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test-blog.com',
      });

      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}/${blog.id}/posts`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should return paginated list of posts for blog', async () => {
      const blog = await blogsTestManager.createBlog({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test-blog.com',
      });

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await blogsTestManager.createPost(blog.id, {
          title: `Post ${i}`,
          shortDescription: `Description ${i}`,
          content: `Content ${i}`,
        });
      }

      const response = await request(httpServer)
        .get(`/${PATHS.BLOGS}/${blog.id}/posts?pageSize=3&pageNumber=2`)
        .expect(HttpStatus.OK);

      const body = response.body as PaginatedViewDto<PostsViewDto[]>;
      expect(body.items).toHaveLength(2); // Second page should have 2 items
      expect(body.totalCount).toBe(5);
      expect(body.pagesCount).toBe(2);
      expect(body.page).toBe(2);
      expect(body.pageSize).toBe(3);
    });

    it('should return 404 when getting posts for non-existing blog', async () => {
      await request(httpServer)
        .get(`/${PATHS.BLOGS}/nonexistentid/posts`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
