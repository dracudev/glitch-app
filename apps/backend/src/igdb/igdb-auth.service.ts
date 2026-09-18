import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}

@Injectable()
export class IgdbAuthService {
  private readonly logger = new Logger(IgdbAuthService.name);
  private cache: TokenCache | null = null;
  private pendingPromise: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async getAccessToken(): Promise<string> {
    if (this.cache && this.cache.expiresAt - Date.now() > 60_000) {
      return this.cache.token;
    }

    // Deduplicate concurrent refreshes
    if (this.pendingPromise) return this.pendingPromise;

    this.pendingPromise = this.fetchToken().finally(() => {
      this.pendingPromise = null;
    });

    return this.pendingPromise;
  }

  private async fetchToken(): Promise<string> {
    const clientId = this.configService.get<string>('TWITCH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('TWITCH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('TWITCH_CLIENT_ID/SECRET not configured');
    }

    const url =
      `https://id.twitch.tv/oauth2/token` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&client_secret=${encodeURIComponent(clientSecret)}` +
      `&grant_type=client_credentials`;

    this.logger.log('Fetching new Twitch/IGDB access token');

    const res = await fetch(url, { method: 'POST' });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Twitch token fetch failed: ${res.status} ${text}`);
      throw new InternalServerErrorException('Failed to obtain IGDB access token');
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    if (!data.access_token) {
      throw new InternalServerErrorException('Invalid token response from Twitch');
    }

    this.cache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    this.logger.log(`IGDB token cached, expires in ${data.expires_in}s`);
    return data.access_token;
  }

  // For testing / manual invalidation
  clearCache() {
    this.cache = null;
  }
}
