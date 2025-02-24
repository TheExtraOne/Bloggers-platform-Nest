import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ERRORS } from '../../../../../constants';

export const DeleteSessionByIdSwagger = {
  decorator: () => {
    return applyDecorators(
      ApiCookieAuth('refreshToken'),
      ApiOperation({
        summary: 'Terminate specific session by id',
        description: 'Terminates a specific session by its deviceId. User can only terminate their own sessions. Protected by JWT Refresh token which should be provided in cookies.',
      }),
      ApiParam({
        name: 'id',
        description: 'Device ID of the session to terminate',
        type: 'string',
        required: true,
      }),
      ApiResponse({
        status: 204,
        description: 'Session has been successfully terminated',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - refresh token is missing, expired or invalid',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - attempting to terminate session that belongs to another user',
      }),
      ApiResponse({
        status: 404,
        description: ERRORS.SESSION_NOT_FOUND,
      }),
    );
  },
};
