import { Blogs } from '../../domain/entities/blog.entity';

export class PgBlogsViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(blog: Blogs): PgBlogsViewDto {
    const { id, name, description, websiteUrl, createdAt, isMembership } = blog;
    const dto = new PgBlogsViewDto();

    dto.id = id.toString();
    dto.name = name;
    dto.description = description;
    dto.websiteUrl = websiteUrl;
    dto.createdAt = createdAt;
    dto.isMembership = isMembership;

    return dto;
  }
}
