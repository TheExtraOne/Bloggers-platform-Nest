import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PATHS } from '../src/constants';
import { deleteAllData } from './helpers/delete-all-data';
import { BlogsTestManager } from './helpers/managers/blogs-test-manager';
import { PaginatedViewDto } from '../src/core/dto/base.paginated-view.dto';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto';
import { PgBlogsViewDto } from '../src/modules/bloggers-platform/blogs/api/view-dto/blogs.view-dto';
import { CreatePostInputDto } from '../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto';
import { PgPostsViewDto } from '../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { TestSettingsInitializer } from './helpers/init-settings';

describe('Blogs Controller (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let blogsTestManager: BlogsTestManager;

  const validBlog: CreateBlogInputDto = {
    name: 'Test Blog',
    description: 'Test Description',
    websiteUrl: 'https://test-blog.com',
  };

  const validPost: Omit<CreatePostInputDto, 'blogId'> = {
    title: 'Test Post',
    shortDescription: 'Test Short Description',
    content: 'Test Content',
  };

  beforeAll(async () => {
    const result = await new TestSettingsInitializer().init();
    app = result.app;
    httpServer = result.httpServer;
    blogsTestManager = result.blogsTestManager;
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Blog operations', () => {
    describe('Blog creation and validation', () => {
      beforeAll(async () => {
        await deleteAllData(app);
      });

      it('should handle blog creation with various validation cases', async () => {
        // Test successful creation
        const response = await blogsTestManager.createBlog({
          name: 'New Blog',
          description: 'New Description',
          websiteUrl: 'https://new-blog.com',
        });
        expect(response).toEqual({
          id: expect.any(String),
          name: 'New Blog',
          description: 'New Description',
          websiteUrl: 'https://new-blog.com',
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        });

        // Test authentication
        await blogsTestManager.createBlog(
          validBlog,
          HttpStatus.UNAUTHORIZED,
          '',
          '',
        );
        await blogsTestManager.createBlog(
          validBlog,
          HttpStatus.UNAUTHORIZED,
          'wrong',
          'wrong',
        );

        // Test validation cases in batch
        const invalidCases = [
          { ...validBlog, name: '' },
          { ...validBlog, name: 'a'.repeat(16) },
          { ...validBlog, name: '   ' },
          { ...validBlog, description: '' },
          { ...validBlog, description: 'a'.repeat(501) },
          { ...validBlog, description: '   ' },
          { ...validBlog, websiteUrl: 'invalid-url' },
          { ...validBlog, websiteUrl: `https://${'a'.repeat(95)}.com` },
          { ...validBlog, websiteUrl: '' },
          { ...validBlog, websiteUrl: '   ' },
        ];

        for (const invalidCase of invalidCases) {
          await blogsTestManager.createBlog(
            invalidCase,
            HttpStatus.BAD_REQUEST,
          );
        }
      });
    });

    describe('Blog retrieval operations', () => {
      beforeAll(async () => {
        await deleteAllData(app);
      });

      it('should handle blog retrieval operations', async () => {
        // Create initial blog for testing
        const blog = await blogsTestManager.createBlog(validBlog);

        // Test single blog retrieval
        const response = await request(httpServer)
          .get(`/${PATHS.BLOGS}/${blog.id}`)
          .expect(HttpStatus.OK);
        expect(response.body.id).toBe(blog.id);

        // Test non-existing blog
        await request(httpServer)
          .get(`/${PATHS.BLOGS}/nonexistentid`)
          .expect(HttpStatus.NOT_FOUND);

        // Create blogs for pagination test
        const blogsToCreate = 4;
        for (let i = 0; i < blogsToCreate; i++) {
          await blogsTestManager.createBlog({
            name: `Blog ${i}`,
            description: 'Test Description',
            websiteUrl: `https://blog-${i}.com`,
          });
        }

        // Test pagination
        const paginatedResponse = await request(httpServer)
          .get(`/${PATHS.BLOGS}?pageSize=3&pageNumber=2`)
          .expect(HttpStatus.OK);

        const body = paginatedResponse.body as PaginatedViewDto<
          PgBlogsViewDto[]
        >;
        expect(body.items).toHaveLength(2);
        expect(body.totalCount).toBe(5);
        expect(body.pagesCount).toBe(2);
        expect(body.page).toBe(2);
        expect(body.pageSize).toBe(3);

        // Test search
        const searchResponse = await request(httpServer)
          .get(`/${PATHS.BLOGS}?searchNameTerm=Blog 0`)
          .expect(HttpStatus.OK);

        const searchBody = searchResponse.body as PaginatedViewDto<
          PgBlogsViewDto[]
        >;
        expect(searchBody.items).toHaveLength(1);
        expect(searchBody.items[0].name).toBe('Blog 0');
      });
    });

    describe('Blog update and delete operations', () => {
      let testBlogId: string;

      beforeAll(async () => {
        await deleteAllData(app);
        const blog = await blogsTestManager.createBlog(validBlog);
        testBlogId = blog.id;
      });

      it('should handle blog update and delete operations', async () => {
        const updateDto: UpdateBlogInputDto = {
          name: 'Updated Blog',
          description: 'Updated Description',
          websiteUrl: 'https://updated-blog.com',
        };

        // Test successful update
        await blogsTestManager.updateBlog(testBlogId, updateDto);
        const updatedBlog = await request(httpServer)
          .get(`/${PATHS.BLOGS}/${testBlogId}`)
          .expect(HttpStatus.OK);
        expect(updatedBlog.body.name).toBe(updateDto.name);

        // Test update authentication and non-existing blog
        await blogsTestManager.updateBlog(
          testBlogId,
          updateDto,
          HttpStatus.UNAUTHORIZED,
          '',
          '',
        );
        await blogsTestManager.updateBlog(
          'nonexistentid',
          updateDto,
          HttpStatus.NOT_FOUND,
        );

        // Test delete operations
        const tempBlog = await blogsTestManager.createBlog({
          name: 'Temp Blog',
          description: 'Temp Description',
          websiteUrl: 'https://temp-blog.com',
        });

        // First deletion should succeed
        await blogsTestManager.deleteBlog(tempBlog.id);

        // Verify deletion
        await request(httpServer)
          .get(`/${PATHS.BLOGS}/${tempBlog.id}`)
          .expect(HttpStatus.NOT_FOUND);

        // Second deletion should return 404
        await blogsTestManager.deleteBlog(
          'nonexistentid',
          HttpStatus.NOT_FOUND,
        );

        // Test unauthorized deletion
        await blogsTestManager.deleteBlog(
          'nonexistentid',
          HttpStatus.UNAUTHORIZED,
          '',
          '',
        );
      });
    });

    describe('Blog posts operations', () => {
      let testBlogId: string;

      beforeAll(async () => {
        await deleteAllData(app);
        const blog = await blogsTestManager.createBlog(validBlog);
        testBlogId = blog.id;
      });

      it('should handle blog posts operations', async () => {
        // Test post creation
        const post = await blogsTestManager.createPost(testBlogId, validPost);
        expect(post).toEqual({
          id: expect.any(String),
          title: validPost.title,
          shortDescription: validPost.shortDescription,
          content: validPost.content,
          blogId: testBlogId,
          blogName: expect.any(String),
          createdAt: expect.any(String),
          extendedLikesInfo: {
            dislikesCount: expect.any(Number),
            likesCount: expect.any(Number),
            myStatus: 'None',
            newestLikes: expect.any(Array),
          },
        });

        // Test post validation cases in batch
        const invalidPosts = [
          { ...validPost, title: '' },
          { ...validPost, title: 'a'.repeat(31) },
          { ...validPost, shortDescription: '' },
          { ...validPost, shortDescription: 'a'.repeat(101) },
          { ...validPost, content: '' },
          { ...validPost, content: 'a'.repeat(1001) },
        ];

        for (const invalidPost of invalidPosts) {
          await blogsTestManager.createPost(
            testBlogId,
            invalidPost,
            HttpStatus.BAD_REQUEST,
          );
        }

        // Test post creation for non-existing blog
        await blogsTestManager.createPost(
          'nonexistentid',
          validPost,
          HttpStatus.NOT_FOUND,
        );

        // Create posts for pagination test
        const postsToCreate = 4; // Create 4 more posts (1 already exists)
        for (let i = 0; i < postsToCreate; i++) {
          await blogsTestManager.createPost(testBlogId, {
            title: `Post ${i}`,
            shortDescription: `Description ${i}`,
            content: `Content ${i}`,
          });
        }

        // Test posts pagination
        const response = await request(httpServer)
          .get(`/${PATHS.BLOGS}/${testBlogId}/posts?pageSize=3&pageNumber=2`)
          .expect(HttpStatus.OK);

        const body = response.body as PaginatedViewDto<PgPostsViewDto[]>;
        expect(body.items).toHaveLength(2);
        expect(body.totalCount).toBe(5);
        expect(body.pagesCount).toBe(2);
        expect(body.page).toBe(2);
        expect(body.pageSize).toBe(3);

        // Test getting posts for non-existing blog
        await request(httpServer)
          .get(`/${PATHS.BLOGS}/nonexistentid/posts`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });
});
