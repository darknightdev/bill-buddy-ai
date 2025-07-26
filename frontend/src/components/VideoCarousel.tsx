"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VideoCarouselProps {
  videos: string[]
  initialIndex?: number
}

export function VideoCarousel({ videos, initialIndex = 0 }: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
    setIsPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(videos.length - 1, prev + 1))
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      setIsPlaying(false)
    }
  }, [currentIndex])

  if (!videos.length) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No videos available</p>
        </CardContent>
      </Card>
    )
  }

  const videoTitles = [
    "Due Date Information",
    "Total Amount Due", 
    "Account Details"
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          Bill Explanations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative group">
          {/* Video Player */}
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden aspect-video shadow-2xl">
            <video
              ref={videoRef}
              key={currentIndex}
              className="w-full h-full object-contain"
              controls
              autoPlay={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`http://localhost:4000${videos[currentIndex]}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video Title Overlay */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
              {videoTitles[currentIndex] || `Explanation ${currentIndex + 1}`}
            </div>
            
            {/* Play/Pause Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isPlaying ? (
                <Pause className="w-16 h-16 text-white" />
              ) : (
                <Play className="w-16 h-16 text-white" />
              )}
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border-0 shadow-lg",
                currentIndex === 0 && "opacity-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === videos.length - 1}
              className={cn(
                "pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border-0 shadow-lg",
                currentIndex === videos.length - 1 && "opacity-50"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Counter and Progress */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600 font-medium">
              {currentIndex + 1} of {videos.length}
            </p>
            <div className="flex gap-1">
              {videos.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentIndex 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600" 
                      : "bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {videoTitles[currentIndex] || `Explanation ${currentIndex + 1}`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 