'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true)
    
    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    
    // Check if user previously dismissed
    const isDismissed = localStorage.getItem('pwa-install-dismissed')
    setDismissed(!!isDismissed)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after short delay if not dismissed
      if (!isDismissed && !isStandalone) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowPrompt(false)
      console.log('PWA installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone, dismissed])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install')
      } else {
        console.log('User dismissed PWA install')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    setDismissed(true)
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS) || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              {isIOS ? <Smartphone className="w-6 h-6 text-blue-400" /> : <Download className="w-6 h-6 text-blue-400" />}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm mb-1">
              Install Fisher Backflows
            </h3>
            <p className="text-slate-300 text-xs mb-3 leading-relaxed">
              {isIOS 
                ? 'Add to your home screen for quick access and offline features'
                : 'Install our app for faster access, offline support, and push notifications'
              }
            </p>
            
            <div className="flex gap-2">
              {isIOS ? (
                <div className="text-xs text-slate-400">
                  <p className="mb-1">Tap <Monitor className="inline w-3 h-3 mx-1" /> then "Add to Home Screen"</p>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Install App
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Offline access</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Push notifications</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Native feel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}