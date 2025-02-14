import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard for login: via local strategy we check login/email and password of the user
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
