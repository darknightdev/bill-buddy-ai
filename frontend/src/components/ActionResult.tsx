"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Clock, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactInfo {
  phone?: string
  email?: string
  chat?: string
  hours?: string
  name?: string
}

interface ActionResultProps {
  success: boolean
  message: string
  actionId?: string
  nextSteps?: string[]
  estimatedTime?: string
  contactInfo?: ContactInfo
  onClose?: () => void
}

export function ActionResult({
  success,
  message,
  actionId,
  nextSteps,
  estimatedTime,
  contactInfo,
  onClose
}: ActionResultProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className={cn(
        "border-0 shadow-lg",
        success ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            {success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Info className="w-6 h-6 text-blue-600" />
            )}
            Action Request Processed
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Message */}
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-gray-800 leading-relaxed">{message}</p>
            {actionId && (
              <p className="text-sm text-gray-500 mt-2">
                Reference ID: <span className="font-mono">{actionId}</span>
              </p>
            )}
          </div>

          {/* Next Steps */}
          {nextSteps && nextSteps.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Next Steps
              </h4>
              <div className="space-y-2">
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {estimatedTime && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-800">Estimated Processing Time</p>
                <p className="text-sm text-gray-600">{estimatedTime}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {contactInfo && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Contact Information</h4>
              <div className="grid gap-3">
                {contactInfo.name && (
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="font-semibold text-gray-800">{contactInfo.name}</p>
                  </div>
                )}
                
                {contactInfo.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Phone</p>
                      <p className="text-sm text-gray-600">{contactInfo.phone}</p>
                    </div>
                    <Button size="sm" className="ml-auto bg-green-600 hover:bg-green-700">
                      Call Now
                    </Button>
                  </div>
                )}
                
                {contactInfo.email && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-sm text-gray-600">{contactInfo.email}</p>
                    </div>
                    <Button size="sm" className="ml-auto bg-blue-600 hover:bg-blue-700">
                      Send Email
                    </Button>
                  </div>
                )}
                
                {contactInfo.chat && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💬</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Live Chat</p>
                      <p className="text-sm text-gray-600">{contactInfo.chat}</p>
                    </div>
                    <Button size="sm" className="ml-auto bg-purple-600 hover:bg-purple-700">
                      Start Chat
                    </Button>
                  </div>
                )}
                
                {contactInfo.hours && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Business Hours</p>
                      <p className="text-sm text-gray-600">{contactInfo.hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              className="flex-1"
            >
              {isExpanded ? "Show Less" : "Show Details"}
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-800">Additional Information</h5>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Your request has been logged and assigned a unique reference number</p>
                  <p>• You can track the status of your request using the reference ID</p>
                  <p>• A confirmation email will be sent to your registered email address</p>
                  <p>• For urgent matters, please use the phone contact provided above</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 