"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PaymentFlow } from "./PaymentFlow"

interface PayButtonProps {
  amount: number
  billerId?: string
  billerName?: string
  accountId?: string
  disabled?: boolean
}

export function PayButton({ 
  amount, 
  billerId, 
  billerName, 
  accountId, 
  disabled = false 
}: PayButtonProps) {
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)

  const handlePaymentComplete = (transactionId: string) => {
    console.log('Payment completed:', transactionId)
    setShowPaymentFlow(false)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setShowPaymentFlow(false)
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Button
            onClick={() => setShowPaymentFlow(true)}
            disabled={disabled || !billerId}
            className="rounded-full px-6 py-3 shadow-lg font-semibold bg-green-500 hover:bg-green-600 text-white"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Pay ${amount}
          </Button>
        </motion.div>
      </div>

      {showPaymentFlow && (
        <PaymentFlow
          billerId={billerId}
          billerName={billerName}
          amount={amount}
          accountId={accountId}
          onPaymentComplete={handlePaymentComplete}
          onPaymentError={handlePaymentError}
        />
      )}
    </>
  )
} 