import { applyDecorators } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function RefreshTokenSwagger() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh JWT tokens',
      description:
        'Uses refresh token from cookie to generate new pair of access and refresh tokens',
    }),
    ApiCookieAuth('refreshToken'),
    ApiResponse({
      status: 200,
      description: 'Success. Returns new access token',
      schema: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or expired refresh token',
    }),
  );
}
