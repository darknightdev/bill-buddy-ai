export interface BillerConfig {
  billerId: string;
  name: string;
  provider: 'paymentus' | 'stripe' | 'none';
  providerCredentials?: {
    apiKey?: string;
    billerCode?: string;
    stripeAccount?: string;
  };
  supportedMethods: ('ACH' | 'CARD' | 'BANK_TRANSFER')[];
  isActive: boolean;
}

export class BillerRegistry {
  private billers: Map<string, BillerConfig> = new Map();

  constructor() {
    this.initializeDefaultBillers();
  }

  private initializeDefaultBillers() {
    // Mock data - in production this would come from a database
    const defaultBillers: BillerConfig[] = [
      {
        billerId: 'UTIL123',
        name: 'Acme Water Co.',
        provider: 'paymentus',
        providerCredentials: {
          apiKey: process.env.PAYMENTUS_API_KEY || 'mock_paymentus_key',
          billerCode: 'ACME_WATER_001'
        },
        supportedMethods: ['ACH', 'CARD'],
        isActive: true
      },
      {
        billerId: 'INS456',
        name: 'Best Health Insurance',
        provider: 'stripe',
        providerCredentials: {
          stripeAccount: process.env.STRIPE_ACCOUNT_ID || 'acct_mock_stripe'
        },
        supportedMethods: ['CARD'],
        isActive: true
      },
      {
        billerId: 'GOV789',
        name: 'City Tax Department',
        provider: 'none',
        supportedMethods: [],
        isActive: true
      },
      {
        billerId: 'ELEC001',
        name: 'Power Grid Electric',
        provider: 'paymentus',
        providerCredentials: {
          apiKey: process.env.PAYMENTUS_API_KEY || 'mock_paymentus_key',
          billerCode: 'POWER_GRID_001'
        },
        supportedMethods: ['ACH', 'CARD', 'BANK_TRANSFER'],
        isActive: true
      },
      {
        billerId: 'GAS002',
        name: 'Natural Gas Co.',
        provider: 'stripe',
        providerCredentials: {
          stripeAccount: process.env.STRIPE_ACCOUNT_ID || 'acct_mock_stripe'
        },
        supportedMethods: ['CARD', 'BANK_TRANSFER'],
        isActive: true
      }
    ];

    defaultBillers.forEach(biller => {
      this.billers.set(biller.billerId, biller);
    });
  }

  public lookupBiller(billerId: string): BillerConfig | null {
    const biller = this.billers.get(billerId);
    if (biller && biller.isActive) {
      return biller;
    }
    
    // If specific biller not found, return first available Paymentus biller as fallback
    if (billerId === 'default-paymentus-biller' || !billerId) {
      const paymentusBillers = Array.from(this.billers.values())
        .filter(b => b.provider === 'paymentus' && b.isActive);
      
      if (paymentusBillers.length > 0) {
        return paymentusBillers[0];
      }
    }
    
    return null;
  }

  public getAllBillers(): BillerConfig[] {
    return Array.from(this.billers.values()).filter(biller => biller.isActive);
  }

  public addBiller(biller: BillerConfig): void {
    this.billers.set(biller.billerId, biller);
  }

  public updateBiller(billerId: string, updates: Partial<BillerConfig>): boolean {
    const existing = this.billers.get(billerId);
    if (!existing) return false;
    
    this.billers.set(billerId, { ...existing, ...updates });
    return true;
  }

  public removeBiller(billerId: string): boolean {
    return this.billers.delete(billerId);
  }

  public searchBillers(query: string): BillerConfig[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.billers.values()).filter(biller => 
      biller.isActive && (
        biller.name.toLowerCase().includes(lowercaseQuery) ||
        biller.billerId.toLowerCase().includes(lowercaseQuery)
      )
    );
  }
}

// Export singleton instance
export const billerRegistry = new BillerRegistry(); 