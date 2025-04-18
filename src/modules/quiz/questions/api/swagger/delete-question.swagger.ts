import { applyDecorators } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function DeleteQuestionSwagger() {
  return applyDecorators(
    ApiBasicAuth('basicAuth'),
    ApiOperation({
      summary: 'Delete question by id',
      description: 'Delete question by id (soft delete)',
    }),
    ApiParam({
      name: 'id',
      description: 'Question id',
      type: 'string',
      required: true,
    }),
    ApiResponse({
      status: 204,
      description: 'Question has been successfully deleted',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 404,
      description: 'Question not found',
    }),
  );
}
