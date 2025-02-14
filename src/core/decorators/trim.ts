import { Transform, TransformFnParams } from 'class-transformer';

// Custom decorator for strings trimming
export const Trim = () => {
  return Transform(({ value }: TransformFnParams) => {
    return typeof value === 'string' ? value.trim() : value;
  });
};
