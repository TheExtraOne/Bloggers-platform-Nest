import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.AC_SECRET as string,
    });
  }

  /**
   * This function accepts payload from jwt token and returns what will be written to req.user
   * @param payload
   */
  async validate(payload: { userId: string }): Promise<{ userId: string }> {
    return payload;
  }
}
