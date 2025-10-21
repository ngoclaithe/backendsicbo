import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    console.log('🔑 [JWT Strategy] JWT Secret:', secret);
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('🔍 [JWT Strategy] Payload:', payload);
    
    const user = await this.authService.validateUser(payload.sub);
    console.log('🔍 [JWT Strategy] User found:', user ? `${user.id} - ${user.username}` : 'NULL');
    
    if (!user) {
      throw new UnauthorizedException('User not found in database');
    }
    
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}