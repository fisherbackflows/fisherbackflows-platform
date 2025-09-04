'use client'

import { useState, useEffect } from 'react'
import { 
  Brain,
  Zap,
  MapPin,
  TrendingUp,
  Calendar,
  Route,
  BarChart3,
  Activity,
  Cpu,
  Database,
  Sparkles,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

interface AIMetric {
  name: string
  value: string | number
  change: number
  icon: React.ReactNode
  description: string
}

interface AIFeature {
  id: string
  name: string
  description: string
  status: 'operational' | 'training' | 'optimizing'
  accuracy: number
  icon: React.ReactNode
  benefits: string[]
  demo: () => void
}

export default function AIShowcasePage() {
  const [metrics, setMetrics] = useState<AIMetric[]>([])
  const [features, setFeatures] = useState<AIFeature[]>([])
  const [isLiveDemo, setIsLiveDemo] = useState(false)
  const [demoData, setDemoData] = useState<any>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  useEffect(() => {
    loadAIMetrics()
    loadAIFeatures()
    
    // Start live demo updates
    const interval = setInterval(() => {
      if (isLiveDemo) {
        updateLiveDemoData()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isLiveDemo])

  const loadAIMetrics = () => {
    setMetrics([
      {
        name: 'Database Performance',
        value: '87%',
        change: 42,
        icon: <Database className="w-5 h-5" />,
        description: 'Query optimization improvement'
      },
      {
        name: 'Route Efficiency',
        value: '94%',
        change: 28,
        icon: <Route className="w-5 h-5" />,
        description: 'AI-optimized travel routes'
      },
      {
        name: 'Prediction Accuracy',
        value: '91%',
        change: 15,
        icon: <Brain className="w-5 h-5" />,
        description: 'ML model performance'
      },
      {
        name: 'Scheduling Efficiency',
        value: '89%',
        change: 35,
        icon: <Calendar className="w-5 h-5" />,
        description: 'Intelligent appointment optimization'
      },
      {
        name: 'Cost Savings',
        value: '$2,847',
        change: 23,
        icon: <TrendingUp className="w-5 h-5" />,
        description: 'Monthly AI-driven savings'
      },
      {
        name: 'Processing Speed',
        value: '2.3s',
        change: -67,
        icon: <Zap className="w-5 h-5" />,
        description: 'Average AI response time'
      }
    ])
  }

  const loadAIFeatures = () => {
    setFeatures([
      {
        id: 'route_optimization',
        name: 'AI Route Optimization',
        description: 'Genetic algorithms optimize technician routes in real-time',
        status: 'operational',
        accuracy: 94,
        icon: <Route className="w-8 h-8" />,
        benefits: ['30% fuel savings', '25% time reduction', 'Dynamic traffic adaptation'],
        demo: () => runRouteOptimizationDemo()
      },
      {
        id: 'predictive_analytics',
        name: 'Predictive Analytics Engine',
        description: 'Machine learning predicts customer behavior and business trends',
        status: 'operational',
        accuracy: 91,
        icon: <Brain className="w-8 h-8" />,
        benefits: ['Churn prediction', 'Demand forecasting', 'Revenue optimization'],
        demo: () => runPredictiveAnalyticsDemo()
      },
      {
        id: 'intelligent_scheduling',
        name: 'Intelligent Scheduling',
        description: 'AI-powered appointment scheduling with preference learning',
        status: 'operational',
        accuracy: 89,
        icon: <Calendar className="w-8 h-8" />,
        benefits: ['Customer preference matching', 'Conflict resolution', 'Workload balancing'],
        demo: () => runSchedulingDemo()
      },
      {
        id: 'realtime_tracking',
        name: 'Real-Time Tracking',
        description: 'Live GPS tracking with predictive arrival times',
        status: 'operational',
        accuracy: 96,
        icon: <MapPin className="w-8 h-8" />,
        benefits: ['Live technician locations', 'Route visualization', 'ETA predictions'],
        demo: () => runTrackingDemo()
      },
      {
        id: 'performance_optimization',
        name: 'Database Optimization',
        description: 'AI-driven database performance tuning and monitoring',
        status: 'optimizing',
        accuracy: 87,
        icon: <Database className="w-8 h-8" />,
        benefits: ['50-90% faster queries', 'Automatic indexing', 'Performance monitoring'],
        demo: () => runPerformanceDemo()
      }
    ])
  }

  const updateLiveDemoData = () => {
    setDemoData({
      activeOptimizations: Math.floor(Math.random() * 12) + 3,
      routesProcessed: Math.floor(Math.random() * 50) + 150,
      mlPredictions: Math.floor(Math.random() * 25) + 75,
      databaseQueries: Math.floor(Math.random() * 1000) + 2500,
      performanceGain: (85 + Math.random() * 10).toFixed(1)
    })
  }

  const runRouteOptimizationDemo = () => {
    setSelectedFeature('route_optimization')
    setDemoData({
      message: 'Running genetic algorithm optimization...',
      progress: 0,
      results: null
    })
    
    // Simulate optimization progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setDemoData({
          message: 'Optimization complete!',
          progress: 100,
          results: {
            routesOptimized: 8,
            timeSaved: '47 minutes',
            fuelSaved: '12.3 miles',
            efficiencyGain: '28%'
          }
        })
      } else {
        setDemoData({
          message: `Optimizing routes... Generation ${Math.floor(progress / 10)}/10`,
          progress,
          results: null
        })
      }
    }, 300)
  }

  const runPredictiveAnalyticsDemo = () => {
    setSelectedFeature('predictive_analytics')
    setDemoData({
      message: 'Analyzing customer patterns and business trends...',
      predictions: [
        { type: 'Customer Churn', risk: 'Medium', count: 3, confidence: '85%' },
        { type: 'Demand Forecast', trend: 'Increasing', change: '+15%', confidence: '78%' },
        { type: 'Revenue Optimization', opportunity: '$4,200', confidence: '91%' },
        { type: 'Equipment Maintenance', alerts: 2, confidence: '82%' }
      ]
    })
  }

  const runSchedulingDemo = () => {
    setSelectedFeature('intelligent_scheduling')
    setDemoData({
      message: 'Optimizing appointment schedules with AI...',
      schedule: {
        optimizedAppointments: 15,
        conflictsResolved: 3,
        customerSatisfaction: '94%',
        workloadBalance: 'Optimal'
      }
    })
  }

  const runTrackingDemo = () => {
    setSelectedFeature('realtime_tracking')
    setDemoData({
      message: 'Live tracking and route monitoring active',
      tracking: {
        activeTechnicians: 4,
        liveRoutes: 6,
        avgSpeed: '32 mph',
        etaAccuracy: '96%'
      }
    })
  }

  const runPerformanceDemo = () => {
    setSelectedFeature('performance_optimization')
    setDemoData({
      message: 'Database performance analysis complete',
      performance: {
        querySpeed: '87% faster',
        indexOptimization: '18 indexes created',
        cacheHitRate: '94%',
        resourceUsage: 'Optimized'
      }
    })
  }

  const toggleLiveDemo = () => {
    setIsLiveDemo(!isLiveDemo)
    if (!isLiveDemo) {
      updateLiveDemoData()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400 bg-green-500/20'
      case 'training': return 'text-yellow-400 bg-yellow-500/20'
      case 'optimizing': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              AI Features Showcase
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Experience the cutting-edge artificial intelligence powering Fisher Backflows' 
            next-generation field service management platform
          </p>
          
          {/* Live Demo Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleLiveDemo}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                isLiveDemo 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
              }`}
            >
              {isLiveDemo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isLiveDemo ? 'Stop Live Demo' : 'Start Live Demo'}
            </button>
            
            {isLiveDemo && (
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="w-5 h-5 animate-pulse" />
                <span className="text-sm">Live AI Processing Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-black/30 backdrop-blur-md border border-blue-500/30 rounded-xl p-4 hover:border-blue-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  {metric.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <div className="text-xs text-gray-400 truncate">{metric.name}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{metric.description}</span>
                <span className={`text-xs font-semibold ${
                  metric.change > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Demo Data */}
        {isLiveDemo && demoData && (
          <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-white">Live AI Processing</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{demoData.activeOptimizations}</div>
                <div className="text-sm text-gray-400">Active Optimizations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{demoData.routesProcessed}</div>
                <div className="text-sm text-gray-400">Routes Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{demoData.mlPredictions}</div>
                <div className="text-sm text-gray-400">ML Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{demoData.databaseQueries}</div>
                <div className="text-sm text-gray-400">DB Queries/min</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{demoData.performanceGain}%</div>
                <div className="text-sm text-gray-400">Performance Gain</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className={`bg-black/30 backdrop-blur-md border rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300 cursor-pointer ${
                selectedFeature === feature.id ? 'border-blue-500/50' : 'border-blue-500/30'
              }`}
              onClick={() => feature.demo()}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{feature.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  
                  {/* Accuracy Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Model Accuracy</span>
                      <span className="text-sm font-semibold text-white">{feature.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${feature.accuracy}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Benefits */}
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Demo Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      feature.demo()
                    }}
                    className="w-full mt-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg py-2 px-4 text-blue-400 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Run Demo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Results */}
        {selectedFeature && demoData && (
          <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Demo Results</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-300">{demoData.message}</p>
              
              {demoData.progress !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-semibold text-white">{Math.round(demoData.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${demoData.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {demoData.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  {Object.entries(demoData.results).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold text-green-400">{String(value)}</div>
                      <div className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {demoData.predictions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoData.predictions.map((prediction: any, index: number) => (
                    <div key={index} className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="font-semibold text-blue-400 mb-2">{prediction.type}</div>
                      <div className="space-y-1 text-sm text-gray-300">
                        {Object.entries(prediction).filter(([key]) => key !== 'type').map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(demoData.schedule || demoData.tracking || demoData.performance) && (
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  {Object.entries(demoData.schedule || demoData.tracking || demoData.performance).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-purple-400">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold text-white">Powered by Advanced AI Technology</span>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Fisher Backflows leverages cutting-edge artificial intelligence, machine learning, and predictive analytics 
            to deliver unparalleled efficiency, cost savings, and customer satisfaction in field service management.
          </p>
        </div>
      </div>
    </div>
  )
}