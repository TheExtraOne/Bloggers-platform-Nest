import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateRefreshTokenCommand } from '../../sessions/app/sessions.use-cases/validate-refresh-token.use-case';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly commandBus: CommandBus) {
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
    const { userId, deviceId, iat } = payload;

    // Check, if there is such active session  by userId, deviceId and iat
    // Checking iat is important
    const session = await this.commandBus.execute(
      new ValidateRefreshTokenCommand(userId, deviceId, iat),
    );

    if (!session) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
