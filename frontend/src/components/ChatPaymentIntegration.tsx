'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { PaymentFlow } from './PaymentFlow';

interface ChatPaymentIntegrationProps {
  billData: {
    billerId?: string;
    billerName?: string;
    accountId?: string;
    totalOwed?: number;
    annotated?: any;
  };
  onPaymentComplete?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

export default function ChatPaymentIntegration({
  billData,
  onPaymentComplete,
  onPaymentError
}: ChatPaymentIntegrationProps) {
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState<string>('');

  const handlePaymentComplete = (transactionId: string) => {
    setPaymentStatus('completed');
    setPaymentMessage(`Payment completed successfully! Transaction ID: ${transactionId}`);
    onPaymentComplete?.(transactionId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    setPaymentMessage(`Payment failed: ${error}`);
    onPaymentError?.(error);
  };

  const initiatePayment = () => {
    setShowPaymentFlow(true);
    setPaymentStatus('idle');
    setPaymentMessage('');
  };

  const closePaymentFlow = () => {
    setShowPaymentFlow(false);
  };

  if (!billData.billerId || !billData.totalOwed) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Payment information not available</span>
        </div>
      </Card>
    );
  }

  if (showPaymentFlow) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Complete Payment</h3>
              <Button variant="ghost" size="sm" onClick={closePaymentFlow}>
                ✕
              </Button>
            </div>
          </div>
          <div className="p-4">
            <PaymentFlow
              billerId={billData.billerId}
              billerName={billData.billerName}
              amount={billData.totalOwed}
              accountId={billData.accountId}
              onPaymentComplete={handlePaymentComplete}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{paymentMessage}</span>
        </div>
      </Card>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{paymentMessage}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={initiatePayment}
          className="mt-2"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="font-semibold">Payment Available</span>
        </div>
        <Badge variant="secondary">
          ${billData.totalOwed?.toFixed(2)}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <p>Biller: {billData.billerName || 'Unknown'}</p>
        <p>Account: {billData.accountId || 'N/A'}</p>
      </div>

      <Button 
        onClick={initiatePayment}
        className="w-full"
        size="sm"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Pay Now
      </Button>
    </Card>
  );
} 