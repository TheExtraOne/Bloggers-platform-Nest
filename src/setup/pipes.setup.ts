import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export function pipesSetup(app: INestApplication) {
  // A global pipe for validation and incoming data transformation.
  app.useGlobalPipes(
    new ValidationPipe({
      // class-transformer creates an instance dto, applies default values and class methods.
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        // Mapping errors to the desired format
        const errorsMessages = errors.map((error: ValidationError) => {
          const field = error.property;
          return {
            message: error.constraints?.[Object.keys(error.constraints)[0]],
            field,
          };
        });
        throw new BadRequestException(errorsMessages);
      },
    }),
  );
}
