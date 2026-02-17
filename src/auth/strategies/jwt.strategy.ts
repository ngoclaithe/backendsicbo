import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
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
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie first
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('🔍 [JWT Strategy] Payload:', payload);

    const user = await this.authService.validateUser(payload.sub);

    if (user) {
      console.log('🔍 [JWT Strategy] FULL USER OBJECT ATTR:', {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    }

    console.log('🔍 [JWT Strategy] User found in DB:', user ? `${user.id} - ${user.username} - Role: ${user.role}` : 'NULL');

    if (!user) {
      throw new UnauthorizedException('User not found in database');
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role
    };
  }
}