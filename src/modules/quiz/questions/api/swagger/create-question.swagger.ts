import { applyDecorators } from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PGQuestionViewDto } from '../view-dto/question.view-dto';

export function CreateQuestionSwagger() {
  return applyDecorators(
    ApiBasicAuth('basicAuth'),
    ApiOperation({
      summary: 'Create a new question',
      description:
        'Creates a new quiz question with the specified body and correct answers',
    }),
    ApiResponse({
      status: 201,
      description: 'Question has been successfully created',
      type: PGQuestionViewDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
