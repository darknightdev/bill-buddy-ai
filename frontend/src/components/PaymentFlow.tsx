"use client"

import { useState, useEffect } from "react"
import { CreditCard, Check, AlertCircle, Loader2, ExternalLink, User, Mail, Phone, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import PaymentusCheckout from "./PaymentusCheckout"

interface PaymentFlowProps {
  billerId?: string
  billerName?: string
  amount: number
  accountId?: string
  onPaymentComplete?: (transactionId: string) => void
  onPaymentError?: (error: string) => void
}

interface BillerCapabilities {
  billerId: string
  billerName: string
  provider: 'paymentus' | 'stripe' | 'none'
  supportedMethods: ('ACH' | 'CARD' | 'BANK_TRANSFER')[]
  isActive: boolean
  isValidAccount: boolean
  canProcessPayment: boolean
}

interface PaymentResponse {
  success: boolean
  transactionId: string
  paymentUrl?: string
  status: 'pending' | 'completed' | 'failed'
  message?: string
  gateway: string
  billerName: string
}

export function PaymentFlow({ 
  billerId, 
  billerName, 
  amount, 
  accountId, 
  onPaymentComplete, 
  onPaymentError 
}: PaymentFlowProps) {
  const [step, setStep] = useState<'checking' | 'capabilities' | 'customer-info' | 'provider-checkout' | 'processing' | 'complete' | 'error'>('checking')
  const [capabilities, setCapabilities] = useState<BillerCapabilities | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'ACH' | 'CARD' | 'BANK_TRANSFER' | null>(null)
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: ''
  })
  const [providerToken, setProviderToken] = useState<string | null>(null)

  // Step 1: Check biller capabilities
  useEffect(() => {
    if (billerId) {
      checkBillerCapabilities()
    }
  }, [billerId, accountId])

  const checkBillerCapabilities = async () => {
    try {
      setStep('checking')
      const params = new URLSearchParams()
      if (accountId) params.append('accountId', accountId)
      
      const response = await fetch(`/api/payment/capabilities/${billerId}?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setCapabilities(data)
        setStep('capabilities')
      } else {
        setError(data.message || 'Failed to check payment capabilities')
        setStep('error')
      }
    } catch (err) {
      setError('Network error while checking capabilities')
      setStep('error')
    }
  }

  const handlePaymentMethodSelect = (method: 'ACH' | 'CARD' | 'BANK_TRANSFER') => {
    setSelectedMethod(method)
    setStep('customer-info')
  }

  const handleCustomerInfoSubmit = async () => {
    if (!capabilities || !billerId || !accountId) return

    try {
      setStep('processing')

      // Route to appropriate provider checkout
      if (capabilities.provider === 'paymentus') {
        // Generate Paymentus token
        const response = await fetch('/api/payment/token/paymentus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userLogin: customerInfo.email,
            accountNumber: accountId,
            billerId
          })
        })

        const data = await response.json()
        
        if (response.ok && data.success) {
          setProviderToken(data.token)
          setStep('provider-checkout')
        } else {
          setError(data.message || 'Failed to initialize payment')
          setStep('error')
          onPaymentError?.(data.message || 'Failed to initialize payment')
        }
      } else {
        // Fallback to generic payment flow for other providers
        await processPayment()
      }
    } catch (err) {
      setError('Network error during payment initialization')
      setStep('error')
      onPaymentError?.('Network error during payment initialization')
    }
  }

  const handleProviderSuccess = (paymentData: any) => {
    console.log('Provider payment success:', paymentData)
    setPaymentResponse({
      success: true,
      transactionId: paymentData["reference-number"]?.toString() || 'unknown',
      status: 'completed',
      message: 'Payment completed successfully',
      gateway: capabilities?.provider || 'unknown',
      billerName: capabilities?.billerName || 'Unknown Biller'
    })
    setStep('complete')
    onPaymentComplete?.(paymentData["reference-number"]?.toString() || 'unknown')
  }

  const handleProviderError = (error: string) => {
    console.error('Provider payment error:', error)
    setError(error)
    setStep('error')
    onPaymentError?.(error)
  }

  const processPayment = async () => {
    if (!selectedMethod || !capabilities || !billerId || !accountId) return

    try {
      setStep('processing')
      
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billerId,
          amount,
          currency: 'USD',
          accountId,
          paymentMethod: selectedMethod,
          customerInfo: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email
          }
        })
      })

      const data: PaymentResponse = await response.json()
      
      if (response.ok && data.success) {
        setPaymentResponse(data)
        setStep('complete')
        onPaymentComplete?.(data.transactionId)
      } else {
        setError(data.message || 'Payment processing failed')
        setStep('error')
        onPaymentError?.(data.message || 'Payment processing failed')
      }
    } catch (err) {
      setError('Network error during payment processing')
      setStep('error')
      onPaymentComplete?.('Network error during payment processing')
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'paymentus':
        return '💳'
      case 'stripe':
        return '💳'
      case 'none':
        return '❌'
      default:
        return '❓'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CARD':
        return '💳'
      case 'ACH':
        return '🏦'
      case 'BANK_TRANSFER':
        return '🏛️'
      default:
        return '💰'
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'checking':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Checking payment capabilities...</span>
            </CardContent>
          </Card>
        )

      case 'capabilities':
        if (!capabilities) return null
        
        if (!capabilities.canProcessPayment) {
          return (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Payment Not Available
                </CardTitle>
                <CardDescription>
                  {capabilities.provider === 'none' 
                    ? 'This biller does not support online payments'
                    : 'This account is not eligible for online payments'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Please contact {capabilities.billerName} directly to make your payment.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('error')}
                  className="w-full"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getProviderIcon(capabilities.provider)}
                {capabilities.billerName}
              </CardTitle>
              <CardDescription>
                Available payment methods for ${amount}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {capabilities.supportedMethods.map((method) => (
                  <Button
                    key={method}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handlePaymentMethodSelect(method)}
                  >
                    <span className="mr-2">{getMethodIcon(method)}</span>
                    {method}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Provider: {capabilities.provider.toUpperCase()}
              </div>
            </CardContent>
          </Card>
        )

                      case 'customer-info':
          return (
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>
                  Please provide your details to complete the payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <Input
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <Input
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="123-456-7890"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Zip Code</label>
                  <Input
                    value={customerInfo.zipCode}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="12345"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('capabilities')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleCustomerInfoSubmit}
                    disabled={!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )

        case 'provider-checkout':
          if (capabilities?.provider === 'paymentus' && providerToken) {
            return (
              <PaymentusCheckout
                token={providerToken}
                accountNumber={accountId || ''}
                paymentAmount={amount}
                billerName={capabilities.billerName}
                onSuccess={handleProviderSuccess}
                onError={handleProviderError}
                onCancel={() => setStep('capabilities')}
              />
            )
          }
          return null

      case 'processing':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Processing payment...</span>
            </CardContent>
          </Card>
        )

      case 'complete':
        if (!paymentResponse) return null
        
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                Payment Initiated
              </CardTitle>
              <CardDescription>
                Transaction ID: {paymentResponse.transactionId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-green-700">
                  {paymentResponse.message}
                </p>
              </div>
              {paymentResponse.paymentUrl && (
                <Button 
                  onClick={() => window.open(paymentResponse.paymentUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Complete Payment
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setStep('capabilities')}
                className="w-full"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        )

      case 'error':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Payment Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 rounded">
                <p className="text-sm text-red-700">
                  {error || 'An unexpected error occurred'}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setStep('capabilities')}
                className="w-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </motion.div>
    </div>
  )
} 