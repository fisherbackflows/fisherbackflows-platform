'use client'

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  format?: 'currency' | 'number' | 'percentage'
  loading?: boolean
}

export default function MetricsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-blue-400',
  format = 'number',
  loading = false
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numVal)
      case 'percentage':
        return `${numVal.toFixed(1)}%`
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(numVal)
    }
  }

  const getTrendIcon = () => {
    if (!change) return <Minus className="w-4 h-4 text-slate-400" />
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getTrendColor = () => {
    if (!change) return 'text-slate-400'
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="w-6 h-6 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-4 bg-slate-700 rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-slate-700 rounded animate-pulse"></div>
          <div className="w-24 h-4 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-8 h-8 ${iconColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-full h-full" />
        </div>
        {getTrendIcon()}
      </div>
      
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-white mb-2">
          {formatValue(value)}
        </p>
        
        {change !== undefined && (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            {changeLabel && (
              <span className="text-slate-500 text-xs">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}