import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountsConfig } from '../user-account.config';

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

  async createAccessToken(payload: Record<'userId', string>): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      expiresIn: this.userAccountsConfig.acExpiry,
      secret: this.userAccountsConfig.acSecret,
    });
  }

  async createRefreshToken(payload: {
    userId: string;
    deviceId: string;
  }): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      expiresIn: this.userAccountsConfig.rtExpiry,
      secret: this.userAccountsConfig.rtSecret,
    });
  }

  async extractTimeFromRefreshToken(
    token: string,
  ): Promise<{ exp: number; iat: number }> {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.userAccountsConfig.rtSecret,
    });
    return { exp: payload.exp, iat: payload.iat };
  }
}
