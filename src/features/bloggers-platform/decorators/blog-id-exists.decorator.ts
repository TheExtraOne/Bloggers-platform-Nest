import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../blogs/infrastructure/blogs.repository';

@ValidatorConstraint({ name: 'BlogIdExists', async: true })
@Injectable()
export class BlogIdExistsRule implements ValidatorConstraintInterface {
  constructor(private readonly blogsRepository: BlogsRepository) {}

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
