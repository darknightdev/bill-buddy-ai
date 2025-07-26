"use client"

import { useState } from "react"
import { CreditCard, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface PayButtonProps {
  amount: number
  onClick: () => void
  disabled?: boolean
}

export function PayButton({ amount, onClick, disabled = false }: PayButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleClick = async () => {
    if (isConfirming) {
      setIsConfirmed(true)
      onClick()
      // Reset after 2 seconds
      setTimeout(() => {
        setIsConfirmed(false)
        setIsConfirming(false)
      }, 2000)
    } else {
      setIsConfirming(true)
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => {
        setIsConfirming(false)
      }, 3000)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isConfirmed ? (
          <motion.div
            key="confirmed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-green-500 text-white rounded-full p-4 shadow-lg"
          >
            <Check className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="pay"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              onClick={handleClick}
              disabled={disabled}
              className={cn(
                "rounded-full px-6 py-3 shadow-lg font-semibold",
                isConfirming
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              )}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isConfirming ? "Confirm Payment" : `Pay $${amount}`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
} 