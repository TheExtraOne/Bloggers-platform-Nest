import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { CustomJwtService, TOKEN_TYPE } from '../facades/custom-jwt.service';

@Injectable()
export class LoginUseCases {
  constructor(private readonly customJwtService: CustomJwtService) {}

  async execute(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken: string = await this.customJwtService.createToken({
      payload: { userId },
      type: TOKEN_TYPE.AC_TOKEN,
    });
    const refreshToken: string = await this.customJwtService.createToken({
      payload: { userId, deviceId: new ObjectId().toString() },
      type: TOKEN_TYPE.R_TOKEN,
    });

    return { accessToken, refreshToken };
  }
}
