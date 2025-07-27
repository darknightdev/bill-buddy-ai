import { BillerConfig } from './BillerRegistry';
import { Auth } from '@paymentus/auth';

interface PaymentusAuthConfig {
  baseUrl: string;
  preSharedKey: string;
  tla: string;
  pixels: string[];
  aud: string;
}

interface PaymentusAuthRequest {
  userLogin: string;
  accountNumber: string;
  billerConfig: BillerConfig;
}

interface PaymentusAuthResponse {
  token: string;
  expiresAt: string;
}

export class PaymentusAuthService {
  private config: PaymentusAuthConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.PAYMENTUS_BASE_URL || 'https://secure1.paymentus.com',
      preSharedKey: process.env.PAYMENTUS_PRE_SHARED_KEY || 'mock-pre-shared-key',
      tla: process.env.PAYMENTUS_TLA || 'TLA',
      pixels: ['user-checkout-pixel'],
      aud: 'WEB_SDK'
    };
  }

  async generateToken(request: PaymentusAuthRequest): Promise<PaymentusAuthResponse> {
    try {
      // Use real Paymentus Auth SDK
      const authClient = new Auth({
        baseUrl: this.config.baseUrl,
        preSharedKey: this.config.preSharedKey,
        tla: this.config.tla,
        kid: '001',
        pixels: ['user-checkout-pixel'],
        aud: this.config.aud as any, // Type assertion for Audience
        userLogin: request.userLogin,
        paymentsData: [{
          accountNumber: request.accountNumber
        }]
      });

      const token = await authClient.fetchToken();
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      console.log('Paymentus: Token generated successfully');

      return {
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Paymentus: Token generation failed:', error);
      throw new Error(`Failed to generate Paymentus token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateToken(token: string): Promise<boolean> {
    // Mock token validation
    // In real implementation, this would validate the token with Paymentus
    return token.startsWith('pyt_');
  }

  getConfig(): PaymentusAuthConfig {
    return this.config;
  }
}

// Export singleton instance
export const paymentusAuthService = new PaymentusAuthService(); 