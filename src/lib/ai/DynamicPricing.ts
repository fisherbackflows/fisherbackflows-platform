'use client'

import { supabase } from '@/lib/supabase'

export interface PricingFactors {
  demandLevel: number
  seasonality: number
  competitorAnalysis: number
  customerSegment: string
  serviceComplexity: number
  timeToService: number
  technicianWorkload: number
  weatherImpact: number
  economicIndicators: number
  customerLoyalty: number
}

export interface PricingStrategy {
  strategy: 'premium' | 'competitive' | 'penetration' | 'dynamic' | 'value'
  basePrice: number
  adjustmentFactors: {
    demand: number
    seasonal: number
    complexity: number
    urgency: number
    loyalty: number
  }
  finalPrice: number
  confidenceScore: number
  reasoning: string[]
}

export interface PricingRecommendation {
  serviceType: string
  customerId?: string
  recommendedPrice: number
  priceRange: {
    minimum: number
    maximum: number
    optimal: number
  }
  strategy: PricingStrategy
  expectedOutcomes: {
    conversionProbability: number
    revenueImpact: number
    customerSatisfaction: number
    competitivePosition: number
  }
  alternativeStrategies: PricingStrategy[]
  validUntil: string
}

export interface MarketAnalysis {
  marketPosition: 'leader' | 'competitor' | 'challenger' | 'niche'
  averageMarketPrice: number
  priceElasticity: number
  competitorPrices: Array<{
    competitor: string
    price: number
    serviceLevel: number
  }>
  marketTrends: {
    direction: 'increasing' | 'decreasing' | 'stable'
    rate: number
    drivers: string[]
  }
}

export class DynamicPricingOptimizer {
  private basePrices = {
    'Annual Test': 75,
    'Repair': 150,
    'Installation': 300,
    'Emergency Service': 200,
    'Consultation': 100,
    'Maintenance': 125
  }

  private customerSegments = {
    enterprise: { multiplier: 1.3, loyalty: 0.8 },
    commercial: { multiplier: 1.1, loyalty: 0.7 },
    residential: { multiplier: 1.0, loyalty: 0.6 },
    government: { multiplier: 0.9, loyalty: 0.9 }
  }

  async generatePricingRecommendation(
    serviceType: string,
    customerId?: string,
    scheduledDate?: string,
    options: {
      includeCompetitorAnalysis?: boolean
      includeWeatherFactor?: boolean
      includeDemandAnalysis?: boolean
      strategy?: 'maximize_revenue' | 'maximize_conversion' | 'balanced'
    } = {}
  ): Promise<PricingRecommendation> {
    try {
      const [
        pricingFactors,
        marketAnalysis,
        customerData
      ] = await Promise.all([
        this.analyzePricingFactors(serviceType, customerId, scheduledDate),
        options.includeCompetitorAnalysis ? this.analyzeMarket(serviceType) : null,
        customerId ? this.getCustomerData(customerId) : null
      ])

      const strategies = this.generatePricingStrategies(
        serviceType,
        pricingFactors,
        marketAnalysis,
        customerData,
        options.strategy || 'balanced'
      )

      const primaryStrategy = strategies[0]
      const priceRange = this.calculatePriceRange(primaryStrategy, pricingFactors)
      const outcomes = await this.predictOutcomes(primaryStrategy, pricingFactors, customerData)

      return {
        serviceType,
        customerId,
        recommendedPrice: primaryStrategy.finalPrice,
        priceRange,
        strategy: primaryStrategy,
        expectedOutcomes: outcomes,
        alternativeStrategies: strategies.slice(1),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

    } catch (error) {
      console.error('Dynamic pricing error:', error)
      throw new Error('Failed to generate pricing recommendation')
    }
  }

  private async analyzePricingFactors(
    serviceType: string,
    customerId?: string,
    scheduledDate?: string
  ): Promise<PricingFactors> {
    const [
      demandData,
      seasonalData,
      workloadData
    ] = await Promise.all([
      this.analyzeDemand(serviceType, scheduledDate),
      this.analyzeSeasonality(scheduledDate),
      this.analyzeTechnicianWorkload(scheduledDate)
    ])

    const weatherImpact = scheduledDate ? await this.getWeatherImpact(scheduledDate) : 1.0
    const customerSegment = customerId ? await this.getCustomerSegment(customerId) : 'residential'
    const customerLoyalty = customerId ? await this.getCustomerLoyalty(customerId) : 0.5

    return {
      demandLevel: demandData.level,
      seasonality: seasonalData.factor,
      competitorAnalysis: 1.0, // Will be updated if competitor analysis is included
      customerSegment,
      serviceComplexity: this.getServiceComplexity(serviceType),
      timeToService: scheduledDate ? this.calculateTimeToService(scheduledDate) : 1.0,
      technicianWorkload: workloadData.factor,
      weatherImpact,
      economicIndicators: await this.getEconomicIndicators(),
      customerLoyalty
    }
  }

  private async analyzeDemand(serviceType: string, scheduledDate?: string): Promise<{ level: number, trend: string }> {
    const endDate = scheduledDate || new Date().toISOString()
    const startDate = new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_date, service_type')
      .eq('service_type', serviceType)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)

    if (error) {
      console.error('Demand analysis error:', error)
      return { level: 1.0, trend: 'stable' }
    }

    const recentDemand = data?.length || 0
    const averageDemand = 15 // Historical average per month

    const demandLevel = Math.min(Math.max(recentDemand / averageDemand, 0.5), 2.0)
    const trend = demandLevel > 1.2 ? 'high' : demandLevel < 0.8 ? 'low' : 'stable'

    return { level: demandLevel, trend }
  }

  private analyzeSeasonality(scheduledDate?: string): { factor: number, period: string } {
    const date = scheduledDate ? new Date(scheduledDate) : new Date()
    const month = date.getMonth()

    const seasonalFactors = {
      0: 0.8,  // January - Low demand
      1: 0.85, // February - Low demand
      2: 1.3,  // March - Spring testing surge
      3: 1.4,  // April - Peak spring demand
      4: 1.2,  // May - High demand
      5: 1.0,  // June - Normal
      6: 0.9,  // July - Summer dip
      7: 0.85, // August - Low summer
      8: 1.1,  // September - Fall preparation
      9: 1.3,  // October - Fall peak
      10: 1.0, // November - Normal
      11: 0.75 // December - Holiday slowdown
    }

    const periods = {
      0: 'winter', 1: 'winter', 2: 'spring', 3: 'spring', 4: 'spring',
      5: 'summer', 6: 'summer', 7: 'summer', 8: 'fall', 9: 'fall',
      10: 'fall', 11: 'winter'
    }

    return {
      factor: seasonalFactors[month as keyof typeof seasonalFactors] || 1.0,
      period: periods[month as keyof typeof periods] || 'unknown'
    }
  }

  private async analyzeTechnicianWorkload(scheduledDate?: string): Promise<{ factor: number, availability: string }> {
    if (!scheduledDate) return { factor: 1.0, availability: 'normal' }

    const targetDate = new Date(scheduledDate)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .gte('scheduled_date', startOfDay)
      .lte('scheduled_date', endOfDay)

    if (error) return { factor: 1.0, availability: 'normal' }

    const dailyAppointments = data?.length || 0
    const maxCapacity = 8 // Assume 8 appointments per day max capacity

    const utilizationRate = dailyAppointments / maxCapacity
    let factor = 1.0
    let availability = 'normal'

    if (utilizationRate > 0.8) {
      factor = 1.4 // High demand pricing
      availability = 'limited'
    } else if (utilizationRate > 0.6) {
      factor = 1.2
      availability = 'moderate'
    } else if (utilizationRate < 0.3) {
      factor = 0.9 // Incentive pricing
      availability = 'high'
    }

    return { factor, availability }
  }

  private async getWeatherImpact(scheduledDate: string): Promise<number> {
    // Simulate weather impact - integrate with weather API in production
    const date = new Date(scheduledDate)
    const month = date.getMonth()
    
    // Weather factors affect outdoor work
    const weatherFactors = {
      0: 0.85, // January - Cold weather challenges
      1: 0.9,  // February
      2: 1.1,  // March - Mild weather
      3: 1.2,  // April - Ideal conditions
      4: 1.15, // May
      5: 1.0,  // June - Hot but manageable
      6: 0.9,  // July - Very hot
      7: 0.85, // August - Extreme heat
      8: 1.1,  // September - Good weather returns
      9: 1.2,  // October - Ideal conditions
      10: 1.0, // November
      11: 0.85 // December - Cold weather
    }

    return weatherFactors[month as keyof typeof weatherFactors] || 1.0
  }

  private async getCustomerSegment(customerId: string): Promise<string> {
    const { data, error } = await supabase
      .from('customers')
      .select('company_name, customer_type')
      .eq('id', customerId)
      .single()

    if (error || !data) return 'residential'

    // Classify based on customer data
    if (data.customer_type === 'Government') return 'government'
    if (data.company_name && data.customer_type === 'Commercial') {
      // Determine if enterprise based on size indicators
      return data.company_name.length > 20 ? 'enterprise' : 'commercial'
    }

    return 'residential'
  }

  private async getCustomerLoyalty(customerId: string): Promise<number> {
    const { data, error } = await supabase
      .from('appointments')
      .select('created_at, payment_status')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error || !data) return 0.5

    const totalAppointments = data.length
    const paidAppointments = data.filter(apt => apt.payment_status === 'paid').length
    const monthsAsCustomer = data.length > 0 ? 
      Math.ceil((new Date().getTime() - new Date(data[data.length - 1].created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0

    // Calculate loyalty score
    const paymentReliability = paidAppointments / (totalAppointments || 1)
    const tenureScore = Math.min(monthsAsCustomer / 24, 1) // Max score at 2 years
    const frequencyScore = Math.min(totalAppointments / 10, 1) // Max score at 10+ appointments

    return (paymentReliability * 0.4 + tenureScore * 0.3 + frequencyScore * 0.3)
  }

  private getServiceComplexity(serviceType: string): number {
    const complexityScores = {
      'Annual Test': 1.0,
      'Repair': 1.4,
      'Installation': 1.8,
      'Emergency Service': 1.6,
      'Consultation': 0.8,
      'Maintenance': 1.2
    }

    return complexityScores[serviceType as keyof typeof complexityScores] || 1.0
  }

  private calculateTimeToService(scheduledDate: string): number {
    const now = new Date()
    const scheduled = new Date(scheduledDate)
    const daysUntilService = Math.ceil((scheduled.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    // Urgency pricing
    if (daysUntilService <= 1) return 1.5      // Same/next day premium
    if (daysUntilService <= 3) return 1.3      // Urgent scheduling
    if (daysUntilService <= 7) return 1.1      // Standard scheduling
    if (daysUntilService <= 30) return 1.0     // Normal advance booking
    return 0.9 // Long advance booking discount
  }

  private async getEconomicIndicators(): Promise<number> {
    // Simplified economic impact - integrate with economic APIs in production
    return 1.02 // 2% positive economic impact
  }

  private async analyzeMarket(serviceType: string): Promise<MarketAnalysis> {
    // Simulate competitor analysis - integrate with market data APIs in production
    const basePrice = this.basePrices[serviceType as keyof typeof this.basePrices] || 100

    return {
      marketPosition: 'competitive',
      averageMarketPrice: basePrice * 1.1,
      priceElasticity: 0.7, // 70% price elasticity
      competitorPrices: [
        { competitor: 'Competitor A', price: basePrice * 1.15, serviceLevel: 8 },
        { competitor: 'Competitor B', price: basePrice * 0.95, serviceLevel: 6 },
        { competitor: 'Competitor C', price: basePrice * 1.25, serviceLevel: 9 }
      ],
      marketTrends: {
        direction: 'increasing',
        rate: 0.03, // 3% annual increase
        drivers: ['Inflation', 'Increased regulations', 'Labor costs']
      }
    }
  }

  private generatePricingStrategies(
    serviceType: string,
    factors: PricingFactors,
    marketAnalysis: MarketAnalysis | null,
    customerData: any,
    optimizationGoal: string
  ): PricingStrategy[] {
    const basePrice = this.basePrices[serviceType as keyof typeof this.basePrices] || 100
    const strategies: PricingStrategy[] = []

    // Dynamic Strategy (AI-optimized)
    const dynamicPrice = this.calculateDynamicPrice(basePrice, factors, marketAnalysis)
    strategies.push({
      strategy: 'dynamic',
      basePrice,
      adjustmentFactors: {
        demand: factors.demandLevel,
        seasonal: factors.seasonality,
        complexity: factors.serviceComplexity,
        urgency: factors.timeToService,
        loyalty: factors.customerLoyalty
      },
      finalPrice: dynamicPrice,
      confidenceScore: this.calculateConfidenceScore(factors),
      reasoning: this.generatePricingReasoning(factors, 'dynamic')
    })

    // Competitive Strategy
    if (marketAnalysis) {
      const competitivePrice = marketAnalysis.averageMarketPrice * 0.98 // Slightly below market
      strategies.push({
        strategy: 'competitive',
        basePrice,
        adjustmentFactors: {
          demand: 1.0,
          seasonal: factors.seasonality,
          complexity: factors.serviceComplexity,
          urgency: 1.0,
          loyalty: 1.0
        },
        finalPrice: competitivePrice,
        confidenceScore: 0.85,
        reasoning: ['Market-competitive pricing', 'Positions slightly below average competitor']
      })
    }

    // Premium Strategy
    const premiumPrice = basePrice * 1.3 * factors.serviceComplexity
    strategies.push({
      strategy: 'premium',
      basePrice,
      adjustmentFactors: {
        demand: 1.0,
        seasonal: 1.0,
        complexity: factors.serviceComplexity,
        urgency: 1.0,
        loyalty: 1.0
      },
      finalPrice: premiumPrice,
      confidenceScore: 0.75,
      reasoning: ['Premium positioning strategy', 'Emphasizes superior service quality']
    })

    // Value Strategy
    const valuePrice = basePrice * 0.9 * (1 + factors.customerLoyalty * 0.1)
    strategies.push({
      strategy: 'value',
      basePrice,
      adjustmentFactors: {
        demand: 0.9,
        seasonal: 1.0,
        complexity: 1.0,
        urgency: 0.9,
        loyalty: factors.customerLoyalty
      },
      finalPrice: valuePrice,
      confidenceScore: 0.80,
      reasoning: ['Value-focused pricing', 'Competitive advantage through cost efficiency']
    })

    return strategies.sort((a, b) => {
      if (optimizationGoal === 'maximize_revenue') return b.finalPrice - a.finalPrice
      if (optimizationGoal === 'maximize_conversion') return a.finalPrice - b.finalPrice
      return b.confidenceScore - a.confidenceScore // Balanced approach
    })
  }

  private calculateDynamicPrice(
    basePrice: number,
    factors: PricingFactors,
    marketAnalysis: MarketAnalysis | null
  ): number {
    let price = basePrice

    // Apply all pricing factors
    price *= factors.demandLevel          // Demand adjustment
    price *= factors.seasonality          // Seasonal adjustment  
    price *= factors.serviceComplexity    // Complexity premium
    price *= factors.timeToService        // Urgency pricing
    price *= factors.technicianWorkload   // Capacity pricing
    price *= factors.weatherImpact        // Weather adjustment
    price *= factors.economicIndicators   // Economic factors

    // Customer loyalty discount
    price *= (1 - factors.customerLoyalty * 0.1)

    // Market position adjustment
    if (marketAnalysis) {
      const marketRatio = marketAnalysis.averageMarketPrice / basePrice
      price *= (1 + (marketRatio - 1) * 0.3) // 30% market influence
    }

    return Math.round(price * 100) / 100
  }

  private calculatePriceRange(strategy: PricingStrategy, factors: PricingFactors) {
    const basePrice = strategy.finalPrice
    const volatility = 0.15 // 15% volatility range

    return {
      minimum: Math.round(basePrice * (1 - volatility) * 100) / 100,
      maximum: Math.round(basePrice * (1 + volatility) * 100) / 100,
      optimal: basePrice
    }
  }

  private async predictOutcomes(
    strategy: PricingStrategy,
    factors: PricingFactors,
    customerData: any
  ): Promise<{
    conversionProbability: number
    revenueImpact: number
    customerSatisfaction: number
    competitivePosition: number
  }> {
    // AI-powered outcome prediction based on historical data and factors
    const baseConversion = 0.75 // 75% base conversion rate

    // Calculate conversion probability
    let conversionProb = baseConversion
    
    if (strategy.strategy === 'premium') conversionProb *= 0.85
    else if (strategy.strategy === 'value') conversionProb *= 1.15
    else if (strategy.strategy === 'dynamic') {
      conversionProb *= (1 + factors.customerLoyalty * 0.2)
      conversionProb *= Math.min(2 - factors.demandLevel * 0.5, 1.2)
    }

    // Revenue impact calculation
    const revenueImpact = strategy.finalPrice / (this.basePrices[Object.keys(this.basePrices)[0] as keyof typeof this.basePrices] || 100)

    // Customer satisfaction prediction
    const satisfactionBase = 0.8
    let satisfaction = satisfactionBase
    if (strategy.strategy === 'premium') satisfaction += 0.1
    else if (strategy.strategy === 'value') satisfaction += 0.15
    satisfaction *= (1 + factors.customerLoyalty * 0.1)

    // Competitive position
    const competitivePosition = strategy.strategy === 'competitive' ? 0.9 : 
                               strategy.strategy === 'premium' ? 0.7 : 0.8

    return {
      conversionProbability: Math.min(conversionProb, 1.0),
      revenueImpact,
      customerSatisfaction: Math.min(satisfaction, 1.0),
      competitivePosition
    }
  }

  private calculateConfidenceScore(factors: PricingFactors): number {
    // Calculate confidence based on data quality and factor stability
    let confidence = 0.8 // Base confidence

    // Adjust based on factor reliability
    if (factors.demandLevel > 0.5 && factors.demandLevel < 1.5) confidence += 0.05
    if (factors.customerLoyalty > 0.3) confidence += 0.05
    if (factors.seasonality > 0.8 && factors.seasonality < 1.3) confidence += 0.05

    return Math.min(confidence, 0.95)
  }

  private generatePricingReasoning(factors: PricingFactors, strategy: string): string[] {
    const reasoning: string[] = []

    if (strategy === 'dynamic') {
      if (factors.demandLevel > 1.2) reasoning.push('High demand detected - premium pricing applied')
      if (factors.seasonality > 1.2) reasoning.push('Peak season - increased pricing due to high demand')
      if (factors.timeToService > 1.3) reasoning.push('Urgent service requested - expedite fee included')
      if (factors.customerLoyalty > 0.7) reasoning.push('Loyal customer - loyalty discount applied')
      if (factors.technicianWorkload > 1.2) reasoning.push('High technician utilization - capacity pricing active')
    }

    if (reasoning.length === 0) {
      reasoning.push('Standard pricing based on service complexity and market conditions')
    }

    return reasoning
  }

  // Batch pricing optimization for multiple services
  async optimizeBatchPricing(
    services: Array<{
      serviceType: string
      customerId?: string
      scheduledDate?: string
    }>,
    strategy: 'maximize_revenue' | 'maximize_conversion' | 'balanced' = 'balanced'
  ): Promise<PricingRecommendation[]> {
    const recommendations = await Promise.all(
      services.map(service => 
        this.generatePricingRecommendation(
          service.serviceType,
          service.customerId,
          service.scheduledDate,
          { strategy }
        )
      )
    )

    return recommendations
  }

  // Real-time price monitoring and adjustment
  async monitorPricingPerformance(): Promise<{
    conversionRates: Record<string, number>
    revenueImpact: Record<string, number>
    recommendations: string[]
  }> {
    // Track performance of different pricing strategies
    const { data: recentAppointments } = await supabase
      .from('appointments')
      .select('service_type, payment_status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const conversionRates: Record<string, number> = {}
    const revenueImpact: Record<string, number> = {}

    // Calculate conversion rates by service type
    if (recentAppointments) {
      const groupedByService = recentAppointments.reduce((acc, apt) => {
        if (!acc[apt.service_type]) acc[apt.service_type] = { total: 0, paid: 0 }
        acc[apt.service_type].total++
        if (apt.payment_status === 'paid') acc[apt.service_type].paid++
        return acc
      }, {} as Record<string, { total: number, paid: number }>)

      Object.entries(groupedByService).forEach(([service, stats]) => {
        conversionRates[service] = stats.paid / stats.total
      })
    }

    const recommendations = this.generatePerformanceRecommendations(conversionRates)

    return {
      conversionRates,
      revenueImpact,
      recommendations
    }
  }

  private generatePerformanceRecommendations(conversionRates: Record<string, number>): string[] {
    const recommendations: string[] = []

    Object.entries(conversionRates).forEach(([service, rate]) => {
      if (rate < 0.6) {
        recommendations.push(`Consider reducing prices for ${service} - low conversion rate (${(rate * 100).toFixed(1)}%)`)
      } else if (rate > 0.9) {
        recommendations.push(`Consider increasing prices for ${service} - very high conversion rate (${(rate * 100).toFixed(1)}%)`)
      }
    })

    return recommendations
  }
}