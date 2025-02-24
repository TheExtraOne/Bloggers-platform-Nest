import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
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
  }): Promise<{ userId: string; deviceId: string }> {
    return payload;
  }
}
