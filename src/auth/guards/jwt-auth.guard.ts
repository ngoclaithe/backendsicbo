import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    console.log('🔍 [JWT Guard] Authorization Header:', request.headers.authorization);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('🔍 [JWT Guard] Validation Result:', { 
      err: err?.message, 
      user, 
      info: info?.message || info 
    });
    
    if (err || !user) {
      throw err || new UnauthorizedException('No user from JWT strategy');
    }
    return user;
  }
}