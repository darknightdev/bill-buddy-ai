"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { VideoCarousel } from "@/components/VideoCarousel"
import { VideoCarouselSkeleton } from "@/components/VideoCarouselSkeleton"
import { ChatBox } from "@/components/ChatBox"
import { ChatBoxSkeleton } from "@/components/ChatBoxSkeleton"
import { Transcript } from "@/components/Transcript"
import { TranscriptSkeleton } from "@/components/TranscriptSkeleton"
import { SkipToChat } from "@/components/SkipToChat"
import { FileUpload } from "@/components/FileUpload"
import { PayButton } from "@/components/PayButton"
import ChatPaymentIntegration from "@/components/ChatPaymentIntegration"
import { ProgressBar } from "@/components/ProgressBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, Play, Bot, CreditCard, Sparkles } from "lucide-react"

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

interface BillData {
  text: string
  annotated: {
    fields: any[]
    raw: any
  }
  snippets: any[]
  videos: string[]
}

export default function Home() {
  const [billData, setBillData] = useState<BillData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [skipToChatClicked, setSkipToChatClicked] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Reset skip to chat highlight after 3 seconds
  useEffect(() => {
    if (skipToChatClicked) {
      const timer = setTimeout(() => {
        setSkipToChatClicked(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [skipToChatClicked])

  // Keyboard shortcut for skip to chat (C key)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' || event.key === 'C') {
        const chatInput = document.getElementById("chat-input")
        if (chatInput && billData && !isLoading) {
          event.preventDefault()
          chatInput.scrollIntoView({ 
            behavior: "smooth", 
            block: "center" 
          })
          setTimeout(() => {
            chatInput.focus()
            setSkipToChatClicked(true)
          }, 500)
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [billData, isLoading])

  // Sample bill data for testing
  const sampleBillText = `Invoice #123
Due Date: 2025-08-15
Amount: $245.00
Account: 12345`

  const processBill = async (billText: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Ingest the text (25% progress)
      const ingestResponse = await fetch("http://localhost:4000/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: billText }),
      })

      if (!ingestResponse.ok) {
        throw new Error(`Ingest failed: ${ingestResponse.status}`)
      }

      const { text } = await ingestResponse.json()

      // Step 2: Annotate the text (50% progress)
      const annotateResponse = await fetch("http://localhost:4000/api/annotate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!annotateResponse.ok) {
        throw new Error(`Annotation failed: ${annotateResponse.status}`)
      }

      const annotated = await annotateResponse.json()

      // Step 3: Generate snippets (75% progress)
      const snippetResponse = await fetch("http://localhost:4000/api/snippet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ annotated }),
      })

      if (!snippetResponse.ok) {
        throw new Error(`Snippet generation failed: ${snippetResponse.status}`)
      }

      const { snippets } = await snippetResponse.json()

      // Step 4: Compose videos (100% progress)
      const composeResponse = await fetch("http://localhost:4000/api/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snippets }),
      })

      if (!composeResponse.ok) {
        throw new Error(`Video composition failed: ${composeResponse.status}`)
      }

      const { videos } = await composeResponse.json()

      // Combine all data
      const data = {
        text,
        annotated,
        snippets,
        videos,
      }

      setBillData(data)

      // Add welcome message
      setMessages([
        {
          id: "welcome",
          from: "ai",
          text: `Hello! I've processed your bill. You have ${videos.length} video explanations ready. You can ask me questions about your bill or use the video carousel above.`,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.error("Error processing bill:", err)
      setError(`Failed to process bill: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDemo = () => {
    setHasStarted(true)
    processBill(sampleBillText)
  }

  const handleSendMessage = async (text: string) => {
    if (!billData) return

    const userMessage: Message = {
      id: Date.now().toString(),
      from: "user",
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsChatLoading(true)

    try {
      const response = await fetch("http://localhost:4000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: text,
          annotated: billData.annotated,
          billContext: {
            billType: "utility", // This would be determined from bill analysis
            serviceProvider: "City Water Department"
          }
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get answer")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: data.answer,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions,
        questionType: data.questionType,
        confidence: data.confidence
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: "Sorry, I couldn't process your question. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleActionRequest = async (actionType: string, actionText: string) => {
    if (!billData) return

    const userMessage: Message = {
      id: Date.now().toString(),
      from: "user",
      text: `I want to ${actionText.toLowerCase()}`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsChatLoading(true)

    try {
      // Handle payment actions specially
      if (actionType === "payment") {
        await handlePaymentAction(actionText)
        return
      }

      const response = await fetch("http://localhost:4000/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionType,
          billData,
          userRequest: `I want to ${actionText.toLowerCase()}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process action")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: data.message,
        timestamp: new Date(),
        suggestedActions: data.nextSteps ? data.nextSteps.map((step: string) => `Track: ${step}`) : undefined
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: "Sorry, I couldn't process your action request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handlePaymentAction = async (actionText: string) => {
    if (!billData?.annotated?.raw) return

    try {
      // Generate Paymentus token directly
      const tokenResponse = await fetch('http://localhost:4000/api/payment/token/paymentus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userLogin: 'user@example.com', // This could be from user session
          accountNumber: billData.annotated.raw.accountId,
          billerId: billData.annotated.raw.billerId || 'default-paymentus-biller'
        })
      })

      const tokenData = await tokenResponse.json()
      
      if (tokenResponse.ok && tokenData.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          from: "ai",
          text: `I've prepared your payment for $${billData.annotated.raw.totalOwed}. Please complete the payment form below:`,
          timestamp: new Date(),
          paymentCheckout: {
            token: tokenData.token,
            accountNumber: billData.annotated.raw.accountId,
            paymentAmount: billData.annotated.raw.totalOwed,
            billerName: billData.annotated.raw.billerName || 'Your Service Provider',
            customerInfo: {
              firstName: 'John', // This could be from user profile
              lastName: 'Doe',
              email: 'user@example.com',
              phone: '1234567890',
              zipCode: '12345'
            }
          }
        }

        setMessages((prev) => [...prev, aiMessage])
      } else {
        throw new Error(tokenData.message || 'Failed to initialize payment')
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        from: "ai",
        text: "Sorry, I couldn't initialize the payment system. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setFileError(null)
    setError(null)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setFileError("Please select a file first")
      return
    }

    setHasStarted(true)
    setIsLoading(true)
    setError(null)
    setFileError(null)
    setUploadSuccess(false)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Upload file to backend
      const uploadResponse = await fetch("http://localhost:4000/api/avp", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      const data = await uploadResponse.json()
      setBillData(data)
      setUploadSuccess(true)

      // Add welcome message
      setMessages([
        {
          id: "welcome",
          from: "ai",
          text: `Hello! I've processed your bill "${selectedFile.name}". You have ${data.videos.length} video explanations ready. You can ask me questions about your bill or use the video carousel above.`,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.error("Error uploading file:", err)
      setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = () => {
    if (billData?.annotated?.raw?.totalOwed) {
      alert(`Payment initiated for $${billData.annotated.raw.totalOwed}`)
    }
  }

  // Landing page
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Bill Assistant
                </h1>
              </div>
                                      <div className="flex items-center gap-2">
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                error={fileError}
                isLoading={isLoading}
                variant="button"
              />
              {selectedFile && !billData && (
                <Button
                  onClick={handleFileUpload}
                  size="sm"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Process
                </Button>
              )}
            </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Understand Your Bills with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Upload any bill and get instant video explanations, AI-powered Q&A, and smart payment options. 
                No more confusion about charges, due dates, or line items.
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-8 mb-12"
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Video Explanations</h3>
                  <p className="text-gray-600">Get personalized video explanations for each part of your bill</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">AI Q&A</h3>
                  <p className="text-gray-600">Ask questions about your bill and get instant, accurate answers</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Smart Payments</h3>
                  <p className="text-gray-600">One-click payment with intelligent payment recommendations</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                error={fileError}
                isLoading={isLoading}
                variant="dropzone"
              />
              
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Button
                    onClick={handleFileUpload}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Process Bill
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Demo Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
                    Or try with sample data
                  </span>
                </div>
              </div>
              
              <Button
                onClick={handleStartDemo}
                variant="outline"
                size="lg"
                className="mt-4 bg-white/80 backdrop-blur-sm border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Try Demo Now
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Experience the full AI bill assistant with a sample bill
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <ProgressBar isLoading={isLoading || isChatLoading} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Bill Assistant</h1>
            </div>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              error={fileError}
              isLoading={isLoading}
              variant="button"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {uploadSuccess && selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-800">
                  Successfully processed <span className="font-semibold">{selectedFile.name}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Video Carousel - Show skeleton while loading, actual component when data is ready */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <VideoCarouselSkeleton />
            </motion.div>
          ) : billData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VideoCarousel 
                videos={billData.videos} 
                initialIndex={currentVideoIndex}
                onVideoChange={setCurrentVideoIndex}
              />
            </motion.div>
          ) : null}

          {/* Transcript Panel - Show skeleton while loading, actual component when data is ready */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TranscriptSkeleton />
            </motion.div>
          ) : billData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Transcript 
                snippets={billData.snippets} 
                isOpen={false}
                currentIndex={currentVideoIndex}
                onItemClick={setCurrentVideoIndex}
              />
            </motion.div>
          ) : null}

          {/* Skip to Chat Button - Show when data is ready */}
          {billData && !isLoading && (
            <SkipToChat onClick={() => setSkipToChatClicked(true)} />
          )}

          {/* Chat Interface - Show skeleton while loading, actual component when data is ready */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ChatBoxSkeleton />
            </motion.div>
          ) : billData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ChatBox
                messages={messages}
                onSend={handleSendMessage}
                onActionRequest={handleActionRequest}
                onPaymentSuccess={(paymentData) => {
                  console.log('Payment completed:', paymentData)
                  
                  // Handle new response format with numbered payment keys
                  const paymentKeys = Object.keys(paymentData).filter(key => key !== 'additionalData')
                  const firstPayment = paymentData[paymentKeys[0]] as any
                  
                  const successMessage: Message = {
                    id: Date.now().toString(),
                    from: "ai",
                    text: `Payment completed successfully! Reference number: ${firstPayment["reference-number"]}. Your payment of $${firstPayment["payment-amount"]} has been processed.`,
                    timestamp: new Date(),
                  }
                  setMessages((prev) => [...prev, successMessage])
                }}
                onPaymentError={(error) => {
                  console.error('Payment error:', error)
                  const errorMessage: Message = {
                    id: Date.now().toString(),
                    from: "ai",
                    text: `Payment failed: ${error}. Please try again or contact support.`,
                    timestamp: new Date(),
                  }
                  setMessages((prev) => [...prev, errorMessage])
                }}
                isLoading={isChatLoading}
                highlightInput={skipToChatClicked}
              />
              
              {/* Payment Integration */}
              {billData.annotated?.raw?.totalOwed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6"
                >
                  <ChatPaymentIntegration
                    billData={{
                      billerId: billData.annotated.raw.billerId,
                      billerName: billData.annotated.raw.billerName,
                      accountId: billData.annotated.raw.accountId,
                      totalOwed: billData.annotated.raw.totalOwed,
                      annotated: billData.annotated
                    }}
                    onPaymentComplete={(transactionId) => {
                      const paymentMessage: Message = {
                        id: Date.now().toString(),
                        from: "ai",
                        text: `Payment completed successfully! Transaction ID: ${transactionId}. A receipt will be sent to your email.`,
                        timestamp: new Date(),
                      }
                      setMessages((prev) => [...prev, paymentMessage])
                    }}
                    onPaymentError={(error) => {
                      const errorMessage: Message = {
                        id: Date.now().toString(),
                        from: "ai",
                        text: `Payment failed: ${error}. Please try again or contact support.`,
                        timestamp: new Date(),
                      }
                      setMessages((prev) => [...prev, errorMessage])
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          ) : null}

          {/* Pay Button */}
          {billData?.annotated?.raw?.totalOwed && (
            <PayButton
              amount={billData.annotated.raw.totalOwed}
              billerId={billData.annotated.raw.billerId}
              billerName={billData.annotated.raw.billerName}
              accountId={billData.annotated.raw.accountId}
              disabled={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  )
}
