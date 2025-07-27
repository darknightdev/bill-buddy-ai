"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot } from "lucide-react"

export function ChatBoxSkeleton() {
  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          Bill Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Area Skeleton */}
        <div className="h-80 overflow-y-auto space-y-4 p-4 border border-gray-200 rounded-xl bg-white shadow-inner">
          {/* AI Message Skeleton */}
          <div className="flex gap-3 justify-start">
            <div className="flex gap-2 max-w-[80%] p-4 rounded-2xl shadow-sm bg-gradient-to-r from-gray-100 to-white border border-gray-200">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-3" />
              </div>
            </div>
          </div>

          {/* User Message Skeleton */}
          <div className="flex gap-3 justify-end">
            <div className="flex gap-2 max-w-[80%] p-4 rounded-2xl shadow-sm bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-4 bg-white/20" />
                <Skeleton className="w-1/2 h-3 bg-white/20" />
              </div>
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Skeleton className="w-3 h-3 bg-white/40 rounded" />
              </div>
            </div>
          </div>

          {/* Another AI Message Skeleton */}
          <div className="flex gap-3 justify-start">
            <div className="flex gap-2 max-w-[80%] p-4 rounded-2xl shadow-sm bg-gradient-to-r from-gray-100 to-white border border-gray-200">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Input Skeleton */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
} 