"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CheckCircle, AlertCircle, X, CreditCard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "paymentus-base": any;
      "tokenization-pixel": any;
      "list-wallets-pixel": any;
      "guest-checkout-pixel": any;
      "user-checkout-pixel": any;
      "user-autopay-pixel": any;
    }
  }
}


interface PaymentAccount {
  accountNumber: string
  paymentAmount: number
  paymentType?: string
  authToken1?: string
}

interface PaymentusChatCheckoutProps {
  token: string
  accounts: PaymentAccount[]
  billerName: string
  customerInfo?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    zipCode?: string
  }
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
  onClose: () => void
}

interface PaymentusPaymentResponse {
  [key: string]: {
    "reference-number": string
    "payment-date": string
    "payment-amount": number
    "total-amount": number
    "payment-status-description": string
    "payment-status": string
  } | {
    header: Array<{
      "payment-amount": string
      "account-number": string
      "payment-type-code": string
      "auth-token1": string
      "check-duplicates": boolean
      "channel-code": string
      "application-code": string
    }>
    "payment-method": {
      token: string
      type: string
    }
    customer: {
      "first-name": string
      "last-name": string
      email: string
      "day-phone-nr": string
      address: {
        "zip-code": string
      }
    }
    "external-data-map": Record<string, any>
  }
}

export function PaymentusChatCheckout({
  token,
  accounts,
  billerName,
  customerInfo,
  onSuccess,
  onError,
  onClose
}: PaymentusChatCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentusPaymentResponse | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Paymentus SDK scripts
    const loadPaymentusSDK = async () => {
      try {
        // Load base SDK
        await loadScript('https://js.paymentus.com/sdk/1.1.5/paymentus_sdk.min.js')
        await loadScript('https://js.paymentus.com/sdk/1.1.5/list_wallets.min.js')
        
        // Load theme
        await loadStylesheet('https://js.paymentus.com/sdk/1.1.5/themes/light.css')
        await loadScript('https://js.paymentus.com/sdk/1.1.5/user_checkout.min.js')
        
        setIsLoading(false)
        initializePaymentusCheckout()
      } catch (err) {
        console.error('Failed to load Paymentus SDK:', err)
        setError('Failed to load payment system')
        setIsLoading(false)
      }
    }

    loadPaymentusSDK()
  }, [token, accounts])

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(script)
    })
  }

  const loadStylesheet = (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`))
      document.head.appendChild(link)
    })
  }

  const initializePaymentusCheckout = () => {
    if (!containerRef.current) return

    try {
      // Add event listeners to the existing elements
      const userCheckoutPixel = containerRef.current.querySelector('user-checkout-pixel')
      if (userCheckoutPixel) {
        userCheckoutPixel.addEventListener('CHECKOUT_SUCCESS', (event: any) => {
          console.log('Paymentus checkout success:', event.detail)
          setPaymentData(event.detail)
          setIsComplete(true)
          onSuccess(event.detail)
        })

        userCheckoutPixel.addEventListener('CHECKOUT_ERROR', (event: any) => {
          console.error('Paymentus checkout error:', event.detail)
          setError('Payment failed. Please try again.')
          onError('Payment failed')
        })

        userCheckoutPixel.addEventListener('CHECKOUT_CANCELLED', (event: any) => {
          console.log('Paymentus checkout cancelled:', event.detail)
          onClose()
        })
      }
    } catch (err) {
      console.error('Failed to initialize Paymentus checkout:', err)
      setError('Failed to initialize payment system')
    }
  }

  const handleClose = () => {
    if (isComplete) {
      onSuccess(paymentData!)
    } else {
      onClose()
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl border border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span className="text-gray-600">Loading payment system...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl border border-red-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
            <AlertCircle className="w-5 h-5" />
            Payment Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-700">{error}</p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isComplete && paymentData) {
    return (
      <Card className="w-full max-w-2xl border border-green-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600 text-lg">
            <CheckCircle className="w-5 h-5" />
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {Object.keys(paymentData).filter(key => key !== 'additionalData').map((key, index) => {
              const payment = paymentData[key] as any
              return (
                <div key={key} className="border-t pt-2 first:border-t-0">
                  <div className="text-sm font-medium text-gray-700 mb-1">Payment {index + 1}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference Number:</span>
                      <span className="font-semibold">{payment["reference-number"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold">${payment["payment-amount"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">${payment["total-amount"]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600">{payment["payment-status"]}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Complete Payment
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">{billerName} - ${accounts.reduce((total, account) => total + account.paymentAmount, 0)}</p>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="w-full"
          style={{ minHeight: '400px' }}
        >
          {token && (
            
            <paymentus-base authorization={token} id="paymentus-base">
              
              <user-checkout-pixel
                payment-accounts={JSON.stringify(accounts.map(account => ({
                  accountNumber: account.accountNumber,
                  paymentType: account.paymentType || "UTILITY",
                  authToken1: account.authToken1 || customerInfo?.zipCode || "12345",
                  paymentAmount: account.paymentAmount
                })))}
                customer-info-config={JSON.stringify({
                  defaultValues: {
                    "first-name": customerInfo?.firstName || "John",
                    "last-name": customerInfo?.lastName || "Doe",
                    "email": customerInfo?.email || "test@paymentus.com",
                    "day-phone-nr": customerInfo?.phone || "1234567890"
                  }
                })}
              ></user-checkout-pixel>
            
            </paymentus-base>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 