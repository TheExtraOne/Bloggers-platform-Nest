import {
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/is-not-empty-string';
import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';

// TODO: move outside
@ValidatorConstraint({ name: 'BlogIdExists', async: true })
@Injectable()
export class BlogIdExists implements ValidatorConstraintInterface {
  constructor(private blogsRepository: BlogsRepository) {}

  async validate(blogId: string) {
    try {
      await this.blogsRepository.findBlogById(blogId);
    } catch (e) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Blog with id ${args.value} doesn't exist`;
  }
}

export class CreatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;

  @IsStringWithTrim()
  @Validate(BlogIdExists)
  blogId: string;
}

export class UpdatePostInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;

  @IsStringWithTrim()
  blogId: string;
}

export class CreatePostFromBlogInputDto {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;
}
