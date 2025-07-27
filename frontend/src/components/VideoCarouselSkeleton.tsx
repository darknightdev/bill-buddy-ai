"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Play } from "lucide-react"

export function VideoCarouselSkeleton() {
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
        <div className="relative">
          {/* Video Player Skeleton */}
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden aspect-video shadow-2xl">
            <Skeleton className="w-full h-full" />
            
            {/* Video Title Overlay Skeleton */}
            <div className="absolute top-4 left-4">
              <Skeleton className="w-32 h-6 rounded-lg" />
            </div>
            
            {/* Mute Button Skeleton */}
            <div className="absolute top-4 right-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </div>

          {/* Navigation Controls Skeleton */}
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>

        {/* Video Counter and Progress Skeleton */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-4" />
            <div className="flex gap-1">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-32 h-4" />
        </div>
      </CardContent>
    </Card>
  )
} 