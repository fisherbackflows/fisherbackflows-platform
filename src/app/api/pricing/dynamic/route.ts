import { NextResponse } from 'next/server'
import { DynamicPricingOptimizer } from '@/lib/ai/DynamicPricing'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('serviceType')
    const customerId = searchParams.get('customerId')
    const scheduledDate = searchParams.get('scheduledDate')
    const includeCompetitor = searchParams.get('includeCompetitor') === 'true'
    const includeWeather = searchParams.get('includeWeather') === 'true'
    const includeDemand = searchParams.get('includeDemand') === 'true'
    const strategy = searchParams.get('strategy') as 'maximize_revenue' | 'maximize_conversion' | 'balanced' || 'balanced'

    if (!serviceType) {
      return NextResponse.json(
        { success: false, error: 'serviceType parameter is required' },
        { status: 400 }
      )
    }

    const pricingOptimizer = new DynamicPricingOptimizer()
    
    const recommendation = await pricingOptimizer.generatePricingRecommendation(
      serviceType,
      customerId || undefined,
      scheduledDate || undefined,
      {
        includeCompetitorAnalysis: includeCompetitor,
        includeWeatherFactor: includeWeather,
        includeDemandAnalysis: includeDemand,
        strategy
      }
    )

    return NextResponse.json({
      success: true,
      recommendation,
      metadata: {
        serviceType,
        customerId: customerId || 'guest',
        scheduledDate: scheduledDate || 'flexible',
        strategy,
        generated: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Dynamic pricing API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate pricing recommendation',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    const pricingOptimizer = new DynamicPricingOptimizer()

    switch (action) {
      case 'batch_pricing':
        const { services, strategy } = data
        if (!services || !Array.isArray(services)) {
          return NextResponse.json(
            { success: false, error: 'services array is required for batch pricing' },
            { status: 400 }
          )
        }

        const batchRecommendations = await pricingOptimizer.optimizeBatchPricing(services, strategy)
        
        return NextResponse.json({
          success: true,
          recommendations: batchRecommendations,
          summary: {
            totalServices: services.length,
            averagePrice: batchRecommendations.reduce((sum, rec) => sum + rec.recommendedPrice, 0) / batchRecommendations.length,
            totalRevenuePotential: batchRecommendations.reduce((sum, rec) => sum + rec.recommendedPrice, 0)
          }
        })

      case 'performance_monitoring':
        const performanceData = await pricingOptimizer.monitorPricingPerformance()
        
        return NextResponse.json({
          success: true,
          performance: performanceData,
          timestamp: new Date().toISOString()
        })

      case 'custom_pricing':
        const { serviceType, customerId, scheduledDate, options } = data
        if (!serviceType) {
          return NextResponse.json(
            { success: false, error: 'serviceType is required' },
            { status: 400 }
          )
        }

        const customRecommendation = await pricingOptimizer.generatePricingRecommendation(
          serviceType,
          customerId,
          scheduledDate,
          options
        )

        return NextResponse.json({
          success: true,
          recommendation: customRecommendation
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Dynamic pricing POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process pricing request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}