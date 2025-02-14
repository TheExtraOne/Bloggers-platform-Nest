import { applyDecorators } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { Trim } from './trim';

// Decorators composition
export const IsStringWithTrim = () =>
  applyDecorators(IsString(), Trim(), IsNotEmpty());
