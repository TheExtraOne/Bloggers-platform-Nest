import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnswerViewDto } from '../../../answers/api/view-dto/answer.view-dto';
import { AnswerInputDto } from '../../../answers/api/input-dto/answer.input-dto';

export function SetUserAnswerSwagger() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Submit an answer for the current question in the active pair game',
      description: `Submit user's answer for the current question in their active pair game. 
        The answer will be validated and evaluated, returning the result with correct/incorrect status.
        
        Input validation:
        - Answer must be a non-empty string
        - Answer must not exceed 500 characters
        - Extra fields in the request body will be stripped`,
    }),
    ApiBody({
      type: AnswerInputDto,
      description: 'Answer for the current question',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Answer has been successfully submitted and evaluated',
      type: AnswerViewDto,
    }),
    ApiBadRequestResponse({
      description: `Invalid input. Possible reasons:
        - Answer string is empty
        - Answer string is longer than 500 characters
        - Answer is not a string
        - Request body is malformed or missing required fields`,
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authorized (invalid or missing access token)',
    }),
    ApiForbiddenResponse({
      description:
        'Either: 1) User is not participating in any active pair game, or 2) User has already answered all questions in the game',
    }),
    ApiExtraModels(AnswerInputDto, AnswerViewDto),
  );
}
