export interface PaymentProviderConfig {
  provider: 'paymentus' | 'stripe' | 'adyen' | 'square';
  enabled: boolean;
  credentials: Record<string, any>;
  options?: Record<string, any>;
}

export interface PaymentConfig {
  defaultProvider: string;
  providers: Record<string, PaymentProviderConfig>;
  webhookSecret?: string;
  timeout: number;
  retryAttempts: number;
}

// Payment configuration
export const paymentConfig: PaymentConfig = {
  defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'paymentus',
  timeout: parseInt(process.env.PAYMENT_TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.PAYMENT_RETRY_ATTEMPTS || '3'),
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  providers: {
    paymentus: {
      provider: 'paymentus',
      enabled: process.env.PAYMENTUS_ENABLED === 'true',
      credentials: {
        apiKey: process.env.PAYMENTUS_API_KEY || 'mock_paymentus_key',
        baseUrl: process.env.PAYMENTUS_BASE_URL || 'https://api.paymentus.com/v1',
        webhookSecret: process.env.PAYMENTUS_WEBHOOK_SECRET
      },
      options: {
        timeout: 30000,
        retryAttempts: 3
      }
    },
    stripe: {
      provider: 'stripe',
      enabled: process.env.STRIPE_ENABLED === 'true',
      credentials: {
        secretKey: process.env.STRIPE_SECRET_KEY || 'mock_stripe_key',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        baseUrl: process.env.STRIPE_BASE_URL || 'https://api.stripe.com/v1'
      },
      options: {
        timeout: 30000,
        retryAttempts: 3
      }
    },
    adyen: {
      provider: 'adyen',
      enabled: process.env.ADYEN_ENABLED === 'true',
      credentials: {
        apiKey: process.env.ADYEN_API_KEY,
        merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
        webhookSecret: process.env.ADYEN_WEBHOOK_SECRET,
        baseUrl: process.env.ADYEN_BASE_URL || 'https://checkout-test.adyen.com/v70'
      },
      options: {
        timeout: 30000,
        retryAttempts: 3
      }
    },
    square: {
      provider: 'square',
      enabled: process.env.SQUARE_ENABLED === 'true',
      credentials: {
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        locationId: process.env.SQUARE_LOCATION_ID,
        webhookSecret: process.env.SQUARE_WEBHOOK_SECRET,
        baseUrl: process.env.SQUARE_BASE_URL || 'https://connect.squareup.com'
      },
      options: {
        timeout: 30000,
        retryAttempts: 3
      }
    }
  }
};

// Helper functions
export function getEnabledProviders(): string[] {
  return Object.entries(paymentConfig.providers)
    .filter(([_, config]) => config.enabled)
    .map(([name, _]) => name);
}

export function getProviderConfig(providerName: string): PaymentProviderConfig | null {
  const config = paymentConfig.providers[providerName];
  return config && config.enabled ? config : null;
}

export function isProviderEnabled(providerName: string): boolean {
  const config = getProviderConfig(providerName);
  return config !== null;
}

export function getDefaultProvider(): string {
  const defaultProvider = paymentConfig.defaultProvider;
  if (isProviderEnabled(defaultProvider)) {
    return defaultProvider;
  }
  
  // Fallback to first enabled provider
  const enabledProviders = getEnabledProviders();
  return enabledProviders[0] || 'none';
} 