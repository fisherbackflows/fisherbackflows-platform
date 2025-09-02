'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Phone, MapPin, Clock, CheckCircle, X, Trash2, Archive, Edit } from 'lucide-react'

interface SwipeAction {
  id: string
  label: string
  icon: ReactNode
  color: string
  action: () => void
  side: 'left' | 'right'
}

interface MobileSwipeActionsProps {
  children: ReactNode
  actions: SwipeAction[]
  onSwipe?: (action: SwipeAction) => void
  threshold?: number
  className?: string
  disabled?: boolean
}

export default function MobileSwipeActions({
  children,
  actions,
  onSwipe,
  threshold = 100,
  className = '',
  disabled = false
}: MobileSwipeActionsProps) {
  const [isSwipe, setIsSwipe] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null)

  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const leftActions = actions.filter(a => a.side === 'left')
  const rightActions = actions.filter(a => a.side === 'right')

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    
    startX.current = e.touches[0].clientX
    isDragging.current = true
    setIsSwipe(false)
    setActiveAction(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging.current) return

    currentX.current = e.touches[0].clientX
    const deltaX = currentX.current - startX.current
    
    setSwipeDistance(deltaX)
    setIsSwipe(Math.abs(deltaX) > 10)
    
    if (deltaX > 0) {
      setSwipeDirection('right')
      // Check if we've crossed the threshold for left actions
      if (deltaX > threshold && leftActions.length > 0) {
        setActiveAction(leftActions[0])
      } else {
        setActiveAction(null)
      }
    } else if (deltaX < 0) {
      setSwipeDirection('left')
      // Check if we've crossed the threshold for right actions
      if (Math.abs(deltaX) > threshold && rightActions.length > 0) {
        setActiveAction(rightActions[0])
      } else {
        setActiveAction(null)
      }
    }
  }

  const handleTouchEnd = () => {
    if (disabled || !isDragging.current) return

    const deltaX = currentX.current - startX.current
    const absDistance = Math.abs(deltaX)

    if (absDistance > threshold && activeAction) {
      // Execute the action
      activeAction.action()
      onSwipe?.(activeAction)
    }

    // Reset state
    setIsSwipe(false)
    setSwipeDirection(null)
    setSwipeDistance(0)
    setActiveAction(null)
    isDragging.current = false
    startX.current = 0
    currentX.current = 0
  }

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    
    startX.current = e.clientX
    isDragging.current = true
    setIsSwipe(false)
    setActiveAction(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !isDragging.current) return

    currentX.current = e.clientX
    const deltaX = currentX.current - startX.current
    
    setSwipeDistance(deltaX)
    setIsSwipe(Math.abs(deltaX) > 10)
    
    if (deltaX > 0) {
      setSwipeDirection('right')
      if (deltaX > threshold && leftActions.length > 0) {
        setActiveAction(leftActions[0])
      } else {
        setActiveAction(null)
      }
    } else if (deltaX < 0) {
      setSwipeDirection('left')
      if (Math.abs(deltaX) > threshold && rightActions.length > 0) {
        setActiveAction(rightActions[0])
      } else {
        setActiveAction(null)
      }
    }
  }

  const handleMouseUp = () => {
    if (disabled || !isDragging.current) return

    const deltaX = currentX.current - startX.current
    const absDistance = Math.abs(deltaX)

    if (absDistance > threshold && activeAction) {
      activeAction.action()
      onSwipe?.(activeAction)
    }

    setIsSwipe(false)
    setSwipeDirection(null)
    setSwipeDistance(0)
    setActiveAction(null)
    isDragging.current = false
    startX.current = 0
    currentX.current = 0
  }

  const getTransform = () => {
    if (!isSwipe) return 'translateX(0px)'
    
    const maxDistance = threshold * 1.5
    const boundedDistance = Math.max(-maxDistance, Math.min(maxDistance, swipeDistance))
    return `translateX(${boundedDistance}px)`
  }

  const getActionOpacity = (action: SwipeAction) => {
    if (!isSwipe) return 0
    
    const progress = Math.abs(swipeDistance) / threshold
    const isCorrectSide = (swipeDirection === 'right' && action.side === 'left') ||
                         (swipeDirection === 'left' && action.side === 'right')
    
    if (!isCorrectSide) return 0
    
    return Math.min(1, progress)
  }

  const getActionTransform = (action: SwipeAction) => {
    const opacity = getActionOpacity(action)
    const scale = 0.8 + (opacity * 0.2)
    return `scale(${scale})`
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: disabled ? 'auto' : 'pan-y' }}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
          {leftActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-center w-20 h-full transition-all duration-200 ${action.color}`}
              style={{
                opacity: getActionOpacity(action),
                transform: getActionTransform(action)
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-white">
                  {action.icon}
                </div>
                <span className="text-xs text-white font-medium">
                  {action.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
          {rightActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-center w-20 h-full transition-all duration-200 ${action.color}`}
              style={{
                opacity: getActionOpacity(action),
                transform: getActionTransform(action)
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-white">
                  {action.icon}
                </div>
                <span className="text-xs text-white font-medium">
                  {action.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        className={`relative z-20 transition-transform ${isSwipe ? 'duration-75' : 'duration-300'} ${
          activeAction ? 'bg-opacity-90' : ''
        }`}
        style={{
          transform: getTransform()
        }}
      >
        {children}
      </div>

      {/* Visual feedback for active action */}
      {activeAction && (
        <div className={`absolute inset-0 ${activeAction.color} opacity-20 z-15 pointer-events-none`}>
          <div className="flex items-center justify-center h-full">
            <div className="bg-white bg-opacity-30 rounded-full p-3 animate-pulse">
              {activeAction.icon}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-configured action types for common use cases
export const SwipeActionPresets = {
  call: (phoneNumber: string): SwipeAction => ({
    id: 'call',
    label: 'Call',
    icon: <Phone className="w-5 h-5" />,
    color: 'bg-green-500',
    side: 'left',
    action: () => window.open(`tel:${phoneNumber}`)
  }),

  navigate: (address: string): SwipeAction => ({
    id: 'navigate',
    label: 'Navigate',
    icon: <MapPin className="w-5 h-5" />,
    color: 'bg-blue-500',
    side: 'left',
    action: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
  }),

  complete: (onComplete: () => void): SwipeAction => ({
    id: 'complete',
    label: 'Complete',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-emerald-500',
    side: 'right',
    action: onComplete
  }),

  delete: (onDelete: () => void): SwipeAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-5 h-5" />,
    color: 'bg-red-500',
    side: 'right',
    action: onDelete
  }),

  archive: (onArchive: () => void): SwipeAction => ({
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-5 h-5" />,
    color: 'bg-gray-500',
    side: 'right',
    action: onArchive
  }),

  edit: (onEdit: () => void): SwipeAction => ({
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="w-5 h-5" />,
    color: 'bg-purple-500',
    side: 'right',
    action: onEdit
  }),

  reschedule: (onReschedule: () => void): SwipeAction => ({
    id: 'reschedule',
    label: 'Reschedule',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-orange-500',
    side: 'left',
    action: onReschedule
  })
}