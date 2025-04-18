import { applyDecorators } from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedQuestionsViewModel } from './paginated-questions.swagger';
import { QuestionsPublishStatus } from '../input-dto/questions-publish-status';

export function GetAllQuestionsSwagger() {
  return applyDecorators(
    ApiBasicAuth(),
    ApiOperation({
      summary: 'Get all questions with pagination and filters',
      description: 'Retrieves a paginated list of questions with optional filtering by body and published status',
    }),
    ApiQuery({
      name: 'bodySearchTerm',
      type: String,
      required: false,
      description: 'Search term to filter questions by body content',
    }),
    ApiQuery({
      name: 'publishedStatus',
      enum: QuestionsPublishStatus,
      required: false,
      description: 'Filter questions by their published status',
    }),
    ApiQuery({
      name: 'sortBy',
      type: String,
      required: false,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortDirection',
      type: String,
      required: false,
      description: 'Sort direction (asc or desc)',
      enum: ['asc', 'desc'],
    }),
    ApiQuery({
      name: 'pageNumber',
      type: Number,
      required: false,
      description: 'Page number for pagination',
      example: 1,
    }),
    ApiQuery({
      name: 'pageSize',
      type: Number,
      required: false,
      description: 'Number of items per page',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Questions have been successfully retrieved',
      type: PaginatedQuestionsViewModel,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
