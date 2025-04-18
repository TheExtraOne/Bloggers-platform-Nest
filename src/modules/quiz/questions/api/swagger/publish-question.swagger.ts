import { applyDecorators } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function PublishQuestionSwagger() {
  return applyDecorators(
    ApiBasicAuth('basicAuth'),
    ApiOperation({
      summary: 'Change question publish status',
      description: 'Update the published status of a question (publish/unpublish)',
    }),
    ApiParam({
      name: 'id',
      description: 'Question id',
      type: 'string',
      required: true,
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['published'],
        properties: {
          published: {
            type: 'boolean',
            description: 'New published status for the question',
          },
        },
      },
    }),
    ApiResponse({
      status: 204,
      description: 'Question publish status has been successfully updated',
    }),
    ApiResponse({
      status: 400,
      description: 'If the inputModel has incorrect values',
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
