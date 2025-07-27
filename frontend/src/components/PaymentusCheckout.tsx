'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface PaymentusCheckoutProps {
  token: string;
  accountNumber: string;
  paymentAmount: number;
  billerName: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentAccount {
  accountNumber: string;
  paymentType: string;
  authToken1: string;
  paymentAmount: number;
}

interface CustomerInfoConfig {
  defaultValues: {
    'first-name': string;
    'last-name': string;
    email: string;
    'day-phone-nr': string;
    'zip-code': string;
  };
}

export default function PaymentusCheckout({
  token,
  accountNumber,
  paymentAmount,
  billerName,
  onSuccess,
  onError,
  onCancel
}: PaymentusCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const paymentusContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPaymentusSDK();
  }, []);

  const loadPaymentusSDK = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load Paymentus SDK scripts
      await loadScript('https://js.paymentus.com/sdk/1.1.5/paymentus_sdk.min.js');
      await loadScript('https://js.paymentus.com/sdk/1.1.5/user_checkout.min.js');
      
      // Load CSS
      loadCSS('https://js.paymentus.com/sdk/1.1.5/themes/light.css');

      // Wait a bit for scripts to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Initialize Paymentus components
      initializePaymentus();
    } catch (err) {
      console.error('Failed to load Paymentus SDK:', err);
      setError('Failed to load payment system. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const loadCSS = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  const initializePaymentus = () => {
    if (!paymentusContainerRef.current) return;

    // Clear container
    paymentusContainerRef.current.innerHTML = '';

    // Create payment accounts data
    const paymentAccounts: PaymentAccount[] = [{
      accountNumber: accountNumber,
      paymentType: 'UTILITY', // Default, could be made configurable
      authToken1: '12345', // Mock zip code - in real app, get from user or bill
      paymentAmount: paymentAmount
    }];

    // Create customer info config
    const customerInfoConfig: CustomerInfoConfig = {
      defaultValues: {
        'first-name': 'John',
        'last-name': 'Doe',
        email: 'test@paymentus.com',
        'day-phone-nr': '1234567890',
        'zip-code': '12345'
      }
    };

    // Create Paymentus elements
    const paymentusBase = document.createElement('paymentus-base');
    paymentusBase.setAttribute('authorization', token);

    const userCheckoutPixel = document.createElement('user-checkout-pixel');
    userCheckoutPixel.setAttribute('payment-accounts', JSON.stringify(paymentAccounts));
    userCheckoutPixel.setAttribute('customer-info-config', JSON.stringify(customerInfoConfig));

    // Add event listeners
    userCheckoutPixel.addEventListener('CHECKOUT_SUCCESS', (event: any) => {
      console.log('Paymentus: Checkout success', event.detail);
      setIsPaymentComplete(true);
      onSuccess(event.detail);
    });

    userCheckoutPixel.addEventListener('CHECKOUT_ERROR', (event: any) => {
      console.error('Paymentus: Checkout error', event.detail);
      setError('Payment failed. Please try again.');
      onError('Payment failed');
    });

    userCheckoutPixel.addEventListener('CHECKOUT_CANCELLED', (event: any) => {
      console.log('Paymentus: Checkout cancelled', event.detail);
      onCancel();
    });

    // Assemble the component
    paymentusBase.appendChild(userCheckoutPixel);
    paymentusContainerRef.current.appendChild(paymentusBase);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading payment system...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => loadPaymentusSDK()}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (isPaymentComplete) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-green-600 mb-4">Payment completed successfully!</div>
          <p className="text-sm text-gray-600">A receipt will be sent to your email.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Paying ${paymentAmount.toFixed(2)} to {billerName}
        </p>
      </div>
      
      <div ref={paymentusContainerRef} className="min-h-[400px]">
        {/* Paymentus components will be rendered here */}
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
} 