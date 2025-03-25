import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ) {
    //super.handleRequest(err, user, info, context, status);
    // We wont' call basic method super.handleRequest(err, user, info, context, status),
    // because it throws an exception
    // if there is no user or if the error is not JWT expired
    // handleRequest(err, user, info, context, status) {
    //   if (err || !user) {
    //     throw err || new common_1.UnauthorizedException();
    //   }
    //   return user;
    // }

    // Instead we won't process the error and null
    if (err || !user) {
      return null;
    } else {
      return user;
    }
  }
}
