import { TPgBlog } from '../../infrastructure/query/pg.blogs.query-repository';

export class PgBlogsViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(blog: TPgBlog): PgBlogsViewDto {
    const dto = new PgBlogsViewDto();

    dto.id = blog.id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.website_url;
    dto.createdAt = blog.created_at;
    dto.isMembership = blog.is_membership;

    return dto;
  }
}
