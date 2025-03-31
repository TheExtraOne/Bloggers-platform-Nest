import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PgBlogsRepository } from '../blogs/infrastructure/pg.blogs.repository';

// This custom decorator is currently unused.
@ValidatorConstraint({ name: 'BlogIdExists', async: true })
@Injectable()
export class BlogIdExistsRule implements ValidatorConstraintInterface {
  constructor(private readonly pgBlogsRepository: PgBlogsRepository) {}

  async validate(blogId: string) {
    let blogExists: boolean;
    try {
      blogExists = await this.pgBlogsRepository.checkBlogExists(blogId);
    } catch (e) {
      return false;
    }

    return blogExists;
  }

  defaultMessage(args: ValidationArguments) {
    return `Blog with id ${args.value} doesn't exist`;
  }
}

export function BlogIdExists(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'BlogIdExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: BlogIdExistsRule,
    });
  };
}
