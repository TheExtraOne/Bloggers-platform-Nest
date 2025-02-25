import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionsRepository } from '../../sessions/infrastructure/sessions.repository';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly sessionsRepository: SessionsRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.RT_SECRET as string,
    });
  }

  /**
   * This function accepts payload from jwt token and returns what will be written to req.user
   * @param payload
   */
  async validate(payload: {
    userId: string;
    deviceId: string;
    iat: number;
  }): Promise<{ userId: string; deviceId: string; iat: number }> {
    // Check, if there is such active session  by userId, deviceId and iat
    // Checking iat is important
    const { userId, deviceId, iat } = payload;
    // TODO: refactor to use case, do not use repository directly
    const result =
      await this.sessionsRepository.findAllSessionsByMultipleFilters(
        userId,
        deviceId,
        new Date(iat * 1000).toISOString(),
      );
    if (!result) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
