"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, ChevronDown } from "lucide-react"

export function TranscriptSkeleton() {
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
          <div className="p-2">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-80 overflow-y-auto space-y-4 p-4 border border-gray-200 rounded-xl bg-white shadow-inner">
          {/* Skeleton items */}
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-32 h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
} 