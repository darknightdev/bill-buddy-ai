"use client"

import { useEffect } from "react"
import NProgress from "nprogress"
import "nprogress/nprogress.css"

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  easing: "ease",
  speed: 500,
  trickleSpeed: 200,
})

interface ProgressBarProps {
  isLoading: boolean
}

export function ProgressBar({ isLoading }: ProgressBarProps) {
  useEffect(() => {
    if (isLoading) {
      NProgress.start()
    } else {
      NProgress.done()
    }

    // Cleanup on unmount
    return () => {
      NProgress.done()
    }
  }, [isLoading])

  return null
} 