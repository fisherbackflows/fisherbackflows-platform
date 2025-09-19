'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: number
    appointments: number
    newCustomers: number
    testsCompleted: number
  }>
  height?: number
}

export default function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [dataKey, setDataKey] = useState<'revenue' | 'appointments' | 'newCustomers' | 'testsCompleted'>('revenue')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatValue = (value: number) => {
    if (dataKey === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(value)
    }
    return value.toString()
  }

  const getDataKeyLabel = () => {
    switch (dataKey) {
      case 'revenue': return 'Revenue'
      case 'appointments': return 'Appointments'
      case 'newCustomers': return 'New Customers'
      case 'testsCompleted': return 'Tests Completed'
    }
  }

  const getDataKeyColor = () => {
    switch (dataKey) {
      case 'revenue': return '#0ea5e9'
      case 'appointments': return '#10b981'
      case 'newCustomers': return '#f59e0b'
      case 'testsCompleted': return '#8b5cf6'
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{formatDate(label)}</p>
          <p className="text-white font-semibold">
            {getDataKeyLabel()}: {formatValue(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      height,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatValue(value)}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              fill={getDataKeyColor()}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatValue(value)}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={getDataKeyColor()}
              strokeWidth={3}
              dot={{ fill: getDataKeyColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: getDataKeyColor(), strokeWidth: 2 }}
            />
          </LineChart>
        )
      
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getDataKeyColor()} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={getDataKeyColor()} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => formatValue(value)}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={getDataKeyColor()}
              strokeWidth={3}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        )
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {getDataKeyLabel()} Trends
          </h3>
          <p className="text-slate-400 text-sm">
            Track {getDataKeyLabel().toLowerCase()} over time
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Data selector */}
          <select
            value={dataKey}
            onChange={(e) => setDataKey(e.target.value as any)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="revenue">Revenue</option>
            <option value="appointments">Appointments</option>
            <option value="newCustomers">New Customers</option>
            <option value="testsCompleted">Tests</option>
          </select>
          
          {/* Chart type selector */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['area', 'bar', 'line'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  chartType === type
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}