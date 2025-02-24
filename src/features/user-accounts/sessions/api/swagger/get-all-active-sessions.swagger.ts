import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionsViewDto } from '../view-dto/sessions.view-dto';

export const GetAllActiveSessionsSwagger = {
  decorator: () => {
    return applyDecorators(
      ApiCookieAuth('refreshToken'),
      ApiOperation({
        summary: 'Get all active sessions for current user',
        description: 'Returns all active sessions for the authenticated user. Protected by JWT Refresh token which should be provided in cookies.',
      }),
      ApiResponse({
        status: 200,
        description: 'List of active sessions successfully returned',
        type: SessionsViewDto,
        isArray: true
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - refresh token is missing, expired or invalid',
      }),
    );
  },
};
