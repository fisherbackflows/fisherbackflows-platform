'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { RotateCcw, ChevronDown, Loader2 } from 'lucide-react'

interface MobilePullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  refreshThreshold?: number
  className?: string
  disabled?: boolean
  refreshText?: string
  releaseText?: string
  loadingText?: string
}

export default function MobilePullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = '',
  disabled = false,
  refreshText = 'Pull down to refresh',
  releaseText = 'Release to refresh',
  loadingText = 'Refreshing...'
}: MobilePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)

  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    
    // Only enable pull to refresh when at the top
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling.current) return

    currentY.current = e.touches[0].clientY
    const deltaY = Math.max(0, currentY.current - startY.current)
    
    // Only proceed if we're still at the top and pulling down
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0 && deltaY < pullDistance) {
      isPulling.current = false
      setPullDistance(0)
      setShowIndicator(false)
      setCanRefresh(false)
      return
    }

    // Apply some resistance to the pull
    const resistance = 0.5
    const adjustedDistance = deltaY * resistance

    setPullDistance(adjustedDistance)
    setShowIndicator(adjustedDistance > 20)
    setCanRefresh(adjustedDistance >= refreshThreshold)

    // Prevent default scrolling when pulling
    if (deltaY > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || !isPulling.current) return

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh error:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Reset state
    isPulling.current = false
    setPullDistance(0)
    setShowIndicator(false)
    setCanRefresh(false)
    startY.current = 0
    currentY.current = 0
  }

  // Handle scroll events to track position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    lastScrollY.current = scrollTop
  }

  const getIndicatorRotation = () => {
    if (isRefreshing) return 'rotate(0deg)'
    if (canRefresh) return 'rotate(180deg)'
    
    const progress = Math.min(pullDistance / refreshThreshold, 1)
    return `rotate(${progress * 180}deg)`
  }

  const getIndicatorOpacity = () => {
    if (isRefreshing) return 1
    if (!showIndicator) return 0
    
    const progress = Math.min(pullDistance / refreshThreshold, 1)
    return 0.3 + (progress * 0.7)
  }

  const getIndicatorScale = () => {
    if (isRefreshing) return 1
    if (!showIndicator) return 0.8
    
    const progress = Math.min(pullDistance / refreshThreshold, 1)
    return 0.8 + (progress * 0.2)
  }

  const getIndicatorText = () => {
    if (isRefreshing) return loadingText
    if (canRefresh) return releaseText
    return refreshText
  }

  useEffect(() => {
    // Auto-hide indicator after refresh completes
    if (!isRefreshing && showIndicator) {
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isRefreshing, showIndicator])

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto h-full ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
      style={{ 
        touchAction: disabled ? 'auto' : 'pan-x pan-down',
        paddingTop: showIndicator || isRefreshing ? '60px' : '0px',
        transition: isPulling.current ? 'none' : 'padding-top 0.3s ease'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex flex-col items-center justify-center transition-all duration-300 ${
          showIndicator || isRefreshing ? 'z-10' : 'z-0'
        }`}
        style={{
          height: '60px',
          transform: `translateY(${showIndicator || isRefreshing ? '0px' : '-60px'})`,
          opacity: getIndicatorOpacity()
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{
            transform: `scale(${getIndicatorScale()})`
          }}
        >
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
              canRefresh 
                ? 'bg-blue-500/20 border-2 border-blue-400' 
                : 'bg-slate-500/20 border-2 border-slate-400'
            }`}
            style={{
              transform: getIndicatorRotation()
            }}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <ChevronDown className={`w-4 h-4 ${canRefresh ? 'text-blue-400' : 'text-slate-400'}`} />
            )}
          </div>

          {/* Text */}
          <span 
            className={`text-xs font-medium transition-colors duration-300 ${
              canRefresh ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            {getIndicatorText()}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          transform: isPulling.current ? `translateY(${pullDistance}px)` : 'translateY(0px)',
          transition: isPulling.current ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Haptic feedback helper for supported devices
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }
    navigator.vibrate(patterns[type])
  }
  
  // iOS haptic feedback
  if ('Taptic' in window) {
    try {
      switch (type) {
        case 'light':
          (window as any).Taptic.impact({ style: 'light' })
          break
        case 'medium':
          (window as any).Taptic.impact({ style: 'medium' })
          break
        case 'heavy':
          (window as any).Taptic.impact({ style: 'heavy' })
          break
      }
    } catch (error) {
      // Silently fail if Taptic is not available
    }
  }
}