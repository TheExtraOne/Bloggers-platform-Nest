// import {
//   createParamDecorator,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { CustomJwtService, TOKEN_TYPE } from '../../app/custom-jwt.service';
// import { Request } from 'express';
// import { JwtService } from '@nestjs/jwt';

// TODO: refactor
// export const ExtractUserFromHeader = createParamDecorator(
//   (data: unknown, context: ExecutionContext): { userId: string } => {
//     const request: Request = context.switchToHttp().getRequest();
//     const jwtToken = request.headers['authorization'];
//     const accessToken: string | undefined = jwtToken?.split(' ')[1];

//     if (!accessToken) throw new UnauthorizedException();

//     const userId: string = new CustomJwtService(new JwtService()).verifyToken({
//       token: accessToken,
//       type: TOKEN_TYPE.AC_TOKEN,
//     });

//     return { userId };
//   },
// );
