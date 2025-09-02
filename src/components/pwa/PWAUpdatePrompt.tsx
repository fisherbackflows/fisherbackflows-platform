'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { usePWA } from './PWAProvider'

export default function PWAUpdatePrompt() {
  const { hasUpdate, updateApp } = usePWA()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (hasUpdate) {
      setShow(true)
    }
  }, [hasUpdate])

  const handleUpdate = () => {
    updateApp()
    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-green-900/95 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
              <RefreshCw className="w-5 h-5 text-green-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              Update Available
            </h3>
            <p className="text-green-100 text-xs mb-3 leading-relaxed">
              A new version of Fisher Backflows is ready with improvements and bug fixes.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Update Now
              </button>
              
              <button
                onClick={handleDismiss}
                className="bg-green-700/50 hover:bg-green-700 text-green-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-green-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}