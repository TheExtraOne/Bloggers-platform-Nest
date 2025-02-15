import { BasicStrategy as Strategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  private readonly validLogin = process.env.LOGIN;
  private readonly validPassword = process.env.PASSWORD;

  constructor() {
    super();
  }

  async validate(login: string, password: string): Promise<boolean> {
    if (this.validLogin === login && this.validPassword === password) {
      return true;
    } else {
      throw new UnauthorizedException();
    }
  }
}
