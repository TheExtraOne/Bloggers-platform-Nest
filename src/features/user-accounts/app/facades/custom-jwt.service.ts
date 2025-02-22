import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export enum TOKEN_TYPE {
  AC_TOKEN = 'AC_TOKEN',
  R_TOKEN = 'REFRESH_TOKEN',
}

@Injectable()
export class CustomJwtService {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
          expiresIn: this.configService.get<string | number>('AC_EXPIRY'),
          secret: this.configService.get<string>('AC_SECRET'),
        });
        break;
      case TOKEN_TYPE.R_TOKEN:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get<string | number>('RT_EXPIRY'),
          secret: this.configService.get<string>('RT_SECRET'),
        });
        break;
      default:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: this.configService.get<string | number>('JWT_EXPIRY'),
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        break;
    }

    return token;
  }
}
