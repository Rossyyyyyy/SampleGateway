import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SecurityConfigType } from '../../config/security.config';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';

interface JwtPayload {
  sub: string;
  partnerId: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly securityConfig: SecurityConfigType;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<SecurityConfigType>('security');
    if (!config) {
      throw new Error('Security configuration not found');
    }
    this.securityConfig = config;
  }

  login(loginDto: LoginDto): TokenResponseDto {
    this.logger.log('Processing login request');

    // TODO: Validate against stored partner credentials in database
    const partner = this.validatePartnerCredentials(
      loginDto.apiKey,
      loginDto.apiSecret,
    );

    if (!partner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: partner.id,
      partnerId: partner.partnerId,
      permissions: partner.permissions,
    };

    const expiresInSeconds = this.parseExpiresIn(
      this.securityConfig.jwtExpiresIn,
    );
    const refreshExpiresInSeconds = this.parseExpiresIn(
      this.securityConfig.jwtRefreshExpiresIn,
    );

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresInSeconds,
    });

    this.logger.log(`Login successful for partner: ${partner.partnerId}`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      refreshToken,
    };
  }

  refreshToken(refreshTokenValue: string): TokenResponseDto {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshTokenValue);
      const expiresInSeconds = this.parseExpiresIn(
        this.securityConfig.jwtExpiresIn,
      );

      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          partnerId: payload.partnerId,
          permissions: payload.permissions,
        },
        { expiresIn: expiresInSeconds },
      );

      return {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: expiresInSeconds,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private validatePartnerCredentials(
    apiKey: string,
    apiSecret: string,
  ): { id: string; partnerId: string; permissions: string[] } | null {
    // TODO: Implement actual partner validation against database
    // This is a placeholder - validates non-empty credentials
    if (!apiKey || !apiSecret) {
      return null;
    }
    return {
      id: 'partner-id',
      partnerId: 'inspire-wallet',
      permissions: ['transfers:read', 'transfers:write', 'accounts:read'],
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}
