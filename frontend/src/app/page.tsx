"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { VideoCarousel } from "@/components/VideoCarousel"
import { ChatBox } from "@/components/ChatBox"
import { PayButton } from "@/components/PayButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, Play, Bot, CreditCard, Sparkles } from "lucide-react"

interface Message {
  id: string
  from: "user" | "ai"
  text: string
  timestamp: Date
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

  // Sample bill data for testing
  const sampleBillText = `Invoice #123
Due Date: 2025-08-15
Amount: $245.00
Account: 12345`

  const processBill = async (billText: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Ingest the text
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

      // Step 2: Annotate the text
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

      // Step 3: Generate snippets
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

      // Step 4: Compose videos
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
              <Button variant="outline" size="sm" className="border-gray-300">
                <Upload className="w-4 h-4 mr-2" />
                Upload Bill
              </Button>
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

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                onClick={handleStartDemo}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
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
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Bill
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-flex items-center px-6 py-3 font-semibold leading-6 text-sm shadow rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 transition ease-in-out duration-150 cursor-not-allowed">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing your bill...
              </div>
            </motion.div>
          )}

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

          {/* Video Carousel */}
          {billData && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VideoCarousel videos={billData.videos} />
            </motion.div>
          )}

          {/* Chat Interface */}
          {billData && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ChatBox
                messages={messages}
                onSend={handleSendMessage}
                isLoading={isChatLoading}
              />
            </motion.div>
          )}

          {/* Pay Button */}
          {billData?.annotated?.raw?.totalOwed && (
            <PayButton
              amount={billData.annotated.raw.totalOwed}
              onClick={handlePayment}
              disabled={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  )
}
