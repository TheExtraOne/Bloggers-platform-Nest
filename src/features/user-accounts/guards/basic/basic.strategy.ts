import { BasicStrategy as Strategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAccountsConfig } from '../../user-account.config';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userAccountsConfig: UserAccountsConfig) {
    super();
  }

  async validate(login: string, password: string): Promise<boolean> {
    if (
      this.userAccountsConfig.adminLogin === login &&
      this.userAccountsConfig.adminPassword === password
    ) {
      return true;
    } else {
      throw new UnauthorizedException();
    }
  }
}
