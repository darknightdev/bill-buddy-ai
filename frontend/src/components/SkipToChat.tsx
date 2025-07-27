"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SkipToChatProps {
  onClick: () => void
}

export function SkipToChat({ onClick }: SkipToChatProps) {
  const handleClick = () => {
    // Smooth scroll to chat input
    const chatInput = document.getElementById("chat-input")
    if (chatInput) {
      chatInput.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      })
      
      // Focus the input after a short delay to ensure scroll completes
      setTimeout(() => {
        chatInput.focus()
      }, 500)
    }
    
    // Call the parent onClick handler
    onClick()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 10px 25px rgba(0, 0, 0, 0.1)",
            "0 15px 35px rgba(59, 130, 246, 0.2)",
            "0 10px 25px rgba(0, 0, 0, 0.1)"
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Button
          onClick={handleClick}
          variant="ghost"
          size="lg"
          className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-200 rounded-full px-6 py-3 text-gray-700 hover:text-gray-900 group relative"
          aria-label="Skip to chat (or press C)"
          title="Skip to chat (or press C)"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Ask a question
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Press C to skip to chat
          </span>
        </Button>
      </motion.div>
    </motion.div>
  )
} 