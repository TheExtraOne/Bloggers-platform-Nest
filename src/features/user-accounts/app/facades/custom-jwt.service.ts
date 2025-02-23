import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountsConfig } from '../../user-account.config';

export enum TOKEN_TYPE {
  AC_TOKEN = 'AC_TOKEN',
  R_TOKEN = 'REFRESH_TOKEN',
}

@Injectable()
export class CustomJwtService {
  constructor(
    private jwtService: JwtService,
    private readonly userAccountsConfig: UserAccountsConfig,
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
          expiresIn: this.userAccountsConfig.acExpiry,
          secret: this.userAccountsConfig.acSecret,
        });
        break;
      case TOKEN_TYPE.R_TOKEN:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: this.userAccountsConfig.rtExpiry,
          secret: this.userAccountsConfig.rtSecret,
        });
        break;
      default:
        token = await this.jwtService.signAsync(payload, {
          expiresIn: this.userAccountsConfig.jwtExpiry,
          secret: this.userAccountsConfig.jwtSecret,
        });
        break;
    }

    return token;
  }
}
