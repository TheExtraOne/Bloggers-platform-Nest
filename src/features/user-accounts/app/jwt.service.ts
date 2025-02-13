import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { SETTINGS } from 'src/settings';

export enum TOKEN_TYPE {
  AC_TOKEN = 'AC_TOKEN',
  R_TOKEN = 'REFRESH_TOKEN',
}

@Injectable()
export class JwtService {
  createToken({
    payload,
    type,
  }: {
    payload: Record<string, string | number>;
    type?: TOKEN_TYPE;
  }): string {
    let token: string;

    switch (type) {
      case TOKEN_TYPE.AC_TOKEN:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        token = jwt.sign(payload, SETTINGS.AC_SECRET, {
          expiresIn: SETTINGS.AC_EXPIRY,
        });
        break;
      case TOKEN_TYPE.R_TOKEN:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        token = jwt.sign(payload, SETTINGS.RT_SECRET, {
          expiresIn: SETTINGS.RT_EXPIRY,
        });
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        token = jwt.sign(payload, SETTINGS.JWT_SECRET, {
          expiresIn: SETTINGS.JWT_EXPIRY,
        });
        break;
    }

    return token;
  }
}
