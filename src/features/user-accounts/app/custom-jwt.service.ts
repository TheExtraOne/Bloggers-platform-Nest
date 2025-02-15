import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SETTINGS } from '../../../constants';

export enum TOKEN_TYPE {
  AC_TOKEN = 'AC_TOKEN',
  R_TOKEN = 'REFRESH_TOKEN',
}

@Injectable()
export class CustomJwtService {
  constructor(private jwtService: JwtService) {}

  async createToken({
    payload,
    type,
  }: {
    payload: Record<string, string | number>;
    type?: TOKEN_TYPE;
  }): Promise<string> {
    let token: string;

    switch (type) {
      case TOKEN_TYPE.AC_TOKEN:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: SETTINGS.AC_EXPIRY,
          secret: SETTINGS.AC_SECRET,
        });
        break;
      case TOKEN_TYPE.R_TOKEN:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: SETTINGS.RT_EXPIRY,
          secret: SETTINGS.RT_SECRET,
        });
        break;
      default:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: SETTINGS.JWT_EXPIRY,
          secret: SETTINGS.JWT_SECRET,
        });
        break;
    }

    return token;
  }
}
