import { applyDecorators } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateQuestionInputDto } from '../input-dto/update-question.input-dto';

export function UpdateQuestionSwagger() {
  return applyDecorators(
    ApiBasicAuth('basicAuth'),
    ApiOperation({
      summary: 'Update question',
      description: 'Update question body and correct answers',
    }),
    ApiParam({
      name: 'id',
      description: 'Question id',
      type: 'string',
      required: true,
    }),
    ApiBody({
      type: UpdateQuestionInputDto,
      description: 'Question update data',
    }),
    ApiResponse({
      status: 204,
      description: 'Question has been successfully updated',
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
