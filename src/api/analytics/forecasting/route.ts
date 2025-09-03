import { NextResponse } from 'next/server'
import { AdvancedForecastingEngine } from '@/lib/ai/AdvancedForecasting'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeHorizon = (searchParams.get('timeHorizon') as '30d' | '90d' | '180d' | '365d') || '90d'
    const includeEconomic = searchParams.get('includeEconomic') !== 'false'
    const includeSeasonality = searchParams.get('includeSeasonality') !== 'false'
    const includeWeather = searchParams.get('includeWeather') !== 'false'
    const granularity = (searchParams.get('granularity') as 'daily' | 'weekly' | 'monthly') || 'weekly'
    const report = searchParams.get('report') === 'true'

    const forecastingEngine = new AdvancedForecastingEngine()

    if (report) {
      const forecastReport = await forecastingEngine.getForecastingReport(timeHorizon)
      
      return NextResponse.json({
        success: true,
        report: forecastReport,
        timestamp: new Date().toISOString()
      })
    }

    const forecast = await forecastingEngine.generateAdvancedForecast({
      timeHorizon,
      includeEconomicFactors: includeEconomic,
      includeSeasonality,
      includeWeatherImpact: includeWeather,
      confidenceInterval: 0.95,
      granularity
    })

    return NextResponse.json({
      success: true,
      forecast,
      metadata: {
        timeHorizon,
        periods: forecast.forecasts.length,
        accuracy: forecast.modelAccuracy.historicalAccuracy,
        generated: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Advanced forecasting API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate advanced forecast',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, options } = body

    const forecastingEngine = new AdvancedForecastingEngine()

    switch (action) {
      case 'custom_forecast':
        const customForecast = await forecastingEngine.generateAdvancedForecast(options)
        return NextResponse.json({
          success: true,
          forecast: customForecast
        })

      case 'economic_integration':
        const { apiKey, provider } = options
        await forecastingEngine.integrateEconomicAPI(apiKey, provider)
        return NextResponse.json({
          success: true,
          message: `Economic API integration configured for ${provider}`
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Advanced forecasting POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process forecasting request',
        details: error.message 
      },
      { status: 500 }
    )
  }
}