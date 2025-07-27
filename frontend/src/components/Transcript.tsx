"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TranscriptProps {
  snippets: Array<{
    snippetId: string
    text: string
    ttsText: string
  }>
  isOpen?: boolean
  currentIndex?: number
  onItemClick?: (index: number) => void
}

export function Transcript({ snippets, isOpen = false, currentIndex = 0, onItemClick }: TranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(isOpen)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleItemClick = (index: number) => {
    onItemClick?.(index)
    // Auto-expand transcript when clicking on an item
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  // Scroll to current item when it changes
  useEffect(() => {
    if (isExpanded && itemRefs.current[currentIndex]) {
      itemRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [currentIndex, isExpanded])

  const videoTitles = [
    "Due Date Information",
    "Total Amount Due", 
    "Account Details"
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Text Transcript
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="pt-0">
              <div ref={containerRef} className="max-h-80 overflow-y-auto space-y-4 p-4 border border-gray-200 rounded-xl bg-white shadow-inner">
                {snippets.map((snippet, index) => (
                  <motion.div
                    key={snippet.snippetId}
                    ref={(el) => {
                      itemRefs.current[index] = el
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex gap-4 p-4 rounded-xl border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md",
                      index === currentIndex
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md"
                        : "bg-gradient-to-r from-gray-50 to-white border-gray-200"
                    )}
                    onClick={() => handleItemClick(index)}
                  >
                    {/* Number indicator */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold",
                      index === currentIndex
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gradient-to-r from-green-600 to-emerald-600"
                    )}>
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <h4 className={cn(
                        "font-semibold",
                        index === currentIndex ? "text-blue-900" : "text-gray-900"
                      )}>
                        {videoTitles[index] || `${snippet.snippetId} Information`}
                      </h4>
                      <p className={cn(
                        "leading-relaxed",
                        index === currentIndex ? "text-blue-700" : "text-gray-700"
                      )}>
                        {snippet.ttsText}
                      </p>
                      <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {snippet.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  {snippets.length} explanation{snippets.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 