"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Maximize2, Minimize2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PaymentusChatCheckout } from "./PaymentusChatCheckout"

interface Message {
  id: string
  from: "user" | "ai"
  text: string
  timestamp: Date
  suggestedActions?: string[]
  questionType?: string
  confidence?: number
  paymentCheckout?: {
    token: string
    accountNumber: string
    paymentAmount: number
    billerName: string
    customerInfo?: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      zipCode?: string
    }
  }
}

interface ChatBoxProps {
  messages: Message[]
  onSend: (text: string) => void
  onActionRequest?: (actionType: string, actionText: string) => void
  onPaymentSuccess?: (paymentData: any) => void
  onPaymentError?: (error: string) => void
  isLoading?: boolean
  highlightInput?: boolean
}

export function ChatBox({ messages, onSend, onActionRequest, onPaymentSuccess, onPaymentError, isLoading = false, highlightInput = false }: ChatBoxProps) {
  const [inputValue, setInputValue] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSend(inputValue.trim())
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Helper function to determine action type from action text
  const getActionType = (actionText: string): string => {
    const lowerAction = actionText.toLowerCase()
    
    if (lowerAction.includes("pay") || lowerAction.includes("payment") || lowerAction.includes("complete payment")) {
      return "payment"
    } else if (lowerAction.includes("service") || lowerAction.includes("repair") || lowerAction.includes("maintenance")) {
      return "service_request"
    } else if (lowerAction.includes("change") || lowerAction.includes("update") || lowerAction.includes("modify")) {
      return "billing_modification"
    } else if (lowerAction.includes("contact") || lowerAction.includes("support")) {
      return "contact_provider"
    } else if (lowerAction.includes("claim") || lowerAction.includes("file")) {
      return "file_claim"
    } else {
      return "general"
    }
  }

  const chatContent = (
    <Card className={`${isFullscreen ? 'w-full h-full max-w-none' : 'w-full max-w-4xl mx-auto'} bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            Bill Assistant
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div 
          className={`overflow-y-auto space-y-4 p-4 border border-gray-200 rounded-xl bg-white shadow-inner ${
            isFullscreen ? 'h-[80vh]' : 'h-96'
          }`}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.from === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex gap-2 max-w-[80%] p-4 rounded-2xl shadow-sm",
                    message.from === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gradient-to-r from-gray-100 to-white border border-gray-200"
                  )}
                >
                  {message.from === "ai" && (
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {/* Payment Checkout Component */}
                    {message.from === "ai" && message.paymentCheckout && (
                      <div className="mt-4">
                        <PaymentusChatCheckout
                          token={message.paymentCheckout.token}
                          accounts={[{
                            accountNumber: message.paymentCheckout.accountNumber,
                            paymentAmount: message.paymentCheckout.paymentAmount
                          }]}
                          billerName={message.paymentCheckout.billerName}
                          customerInfo={message.paymentCheckout.customerInfo}
                          onSuccess={onPaymentSuccess || (() => {})}
                          onError={onPaymentError || (() => {})}
                          onClose={() => {}}
                        />
                      </div>
                    )}
                    
                    {/* Suggested Actions */}
                    {message.from === "ai" && message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-600 font-medium">Suggested Actions:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => onActionRequest?.(getActionType(action), action)}
                              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors duration-200"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className={cn(
                      "text-xs mt-2",
                      message.from === "user" ? "text-blue-100" : "text-gray-500"
                    )}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.from === "user" && (
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="flex gap-2 bg-gradient-to-r from-gray-100 to-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              id="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your bill..."
              disabled={isLoading}
              className={cn(
                "pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300",
                highlightInput && "border-blue-500 ring-2 ring-blue-200 bg-blue-50"
              )}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-6xl max-h-[90vh] relative">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 h-8 w-8 p-0 bg-white"
          >
            <X className="w-3 h-3" />
          </Button>
          {chatContent}
        </div>
      </div>
    )
  }

  return chatContent
} 