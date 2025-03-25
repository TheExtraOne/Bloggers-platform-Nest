import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const DeleteAllSessionsSwagger = {
  decorator: () => {
    return applyDecorators(
      ApiCookieAuth('refreshToken'),
      ApiOperation({
        summary: 'Terminate all sessions except current',
        description: 'Terminates all user sessions except the one from which the request is made. Protected by JWT Refresh token which should be provided in cookies.',
      }),
      ApiResponse({
        status: 204,
        description: 'All sessions (except current) have been successfully terminated',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - refresh token is missing, expired or invalid',
      }),
    );
  },
};
