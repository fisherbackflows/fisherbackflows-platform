import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Web scraping targets for lead generation
const SCRAPING_TARGETS = {
  GOOGLE_MAPS_BUSINESS: {
    name: 'Google Maps Business Listings',
    baseUrl: 'https://www.google.com/maps/search/',
    searchTerms: [
      'restaurants near Puyallup WA',
      'medical facilities Tacoma WA', 
      'industrial buildings Auburn WA',
      'office buildings Federal Way WA',
      'dental clinics Sumner WA'
    ],
    selectors: {
      businessName: '.DUwDvf',
      address: '.W4Efsd:nth-child(1) .W4Efsd',
      phone: '.W4Efsd:nth-child(2)',
      website: 'a[data-value="Website"]',
      rating: '.MW4etd'
    }
  },
  YELP_BUSINESS_DIRECTORY: {
    name: 'Yelp Business Directory',
    baseUrl: 'https://www.yelp.com/search',
    searchTerms: [
      'restaurants Puyallup WA',
      'medical Tacoma WA',
      'industrial Auburn WA'
    ],
    selectors: {
      businessName: '.css-1se8maq',
      address: '.css-qgunke',
      phone: '.css-1e4fdj9',
      website: '.css-1m051bw',
      category: '.css-11bijt4'
    }
  },
  YELLOWPAGES: {
    name: 'Yellow Pages Directory',
    baseUrl: 'https://www.yellowpages.com/search',
    searchTerms: [
      'restaurants-Puyallup-WA',
      'hospitals-Tacoma-WA',
      'manufacturing-Auburn-WA'
    ],
    selectors: {
      businessName: '.business-name',
      address: '.street-address',
      phone: '.phones',
      website: '.website',
      category: '.categories'
    }
  },
  CHAMBER_OF_COMMERCE: {
    name: 'Local Chamber of Commerce',
    urls: [
      'https://www.puyallupchamber.com/directory',
      'https://www.tacomachamber.org/member-directory',
      'https://www.auburnareachamber.org/directory'
    ],
    selectors: {
      businessName: '.member-name',
      address: '.member-address',
      phone: '.member-phone',
      category: '.member-category'
    }
  },
  PERMIT_DATABASES: {
    name: 'Building Permit Databases',
    urls: [
      'https://aca-prod.accela.com/PIERCECO/Default.aspx',
      'https://permits.cityoftacoma.org/citizenaccess/',
      'https://www.auburnwa.gov/city_services/building_services/permits_applications/'
    ],
    selectors: {
      permitType: '.permit-type',
      address: '.permit-address',
      applicant: '.applicant-name',
      issueDate: '.issue-date'
    }
  }
};

// User agents for rotation to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

// Rate limiting configuration
const RATE_LIMITS = {
  requestsPerMinute: 30,
  requestsPerHour: 500,
  delayBetweenRequests: 2000, // milliseconds
  retryAttempts: 3,
  backoffMultiplier: 1.5
};

// Business classification keywords
const CLASSIFICATION_KEYWORDS = {
  medical: [
    'hospital', 'clinic', 'medical', 'dental', 'surgery', 'health', 
    'physician', 'doctor', 'healthcare', 'urgent care', 'family practice'
  ],
  restaurant: [
    'restaurant', 'cafe', 'diner', 'bistro', 'grill', 'kitchen', 
    'food', 'dining', 'bakery', 'brewery', 'bar', 'pizzeria'
  ],
  industrial: [
    'manufacturing', 'factory', 'plant', 'industrial', 'warehouse', 
    'distribution', 'processing', 'production', 'fabrication'
  ],
  office: [
    'office', 'corporate', 'business', 'professional', 'consulting', 
    'services', 'accounting', 'legal', 'insurance', 'real estate'
  ],
  retail: [
    'retail', 'store', 'shop', 'market', 'mall', 'center', 'plaza', 
    'boutique', 'outlet', 'showroom', 'dealership'
  ]
};

// Proxy rotation for high-volume scraping (mock implementation)
class ProxyRotator {
  private proxies: string[] = [
    // In production, add real proxy servers
    'http://proxy1:8080',
    'http://proxy2:8080',
    'http://proxy3:8080'
  ];
  private currentIndex: number = 0;
  
  getNext(): string | null {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests: number[] = [];
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < 60000); // Remove requests older than 1 minute
    return this.requests.length < RATE_LIMITS.requestsPerMinute;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
  
  getDelay(): number {
    return RATE_LIMITS.delayBetweenRequests;
  }
}

// Enhanced web scraper class
class WebScraper {
  private rateLimiter: RateLimiter;
  private proxyRotator: ProxyRotator;
  private userAgentIndex: number = 0;
  
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.proxyRotator = new ProxyRotator();
  }
  
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async scrapeUrl(url: string, selectors: any, retries: number = 0): Promise<any[]> {
    if (!this.rateLimiter.canMakeRequest()) {
      await this.delay(this.rateLimiter.getDelay());
    }
    
    try {
      // In a real implementation, you'd use a proper HTTP client with proxy support
      // For demonstration, we'll simulate the scraping process
      
      console.log(`Scraping URL: ${url}`);
      this.rateLimiter.recordRequest();
      
      // Simulate HTTP request delay
      await this.delay(1000 + Math.random() * 2000);
      
      // Mock scraped data - in production, this would parse real HTML
      const mockScrapedData = this.generateMockScrapedData(url);
      
      return mockScrapedData;
      
    } catch (error) {
      console.error(`Scraping error for ${url}:`, error);
      
      if (retries < RATE_LIMITS.retryAttempts) {
        const backoffDelay = RATE_LIMITS.delayBetweenRequests * Math.pow(RATE_LIMITS.backoffMultiplier, retries);
        await this.delay(backoffDelay);
        return this.scrapeUrl(url, selectors, retries + 1);
      }
      
      return [];
    }
  }
  
  private generateMockScrapedData(url: string): any[] {
    // Generate realistic mock data based on the URL
    const mockData = [];
    const recordCount = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < recordCount; i++) {
      let businessType = 'office';
      let businessName = '';
      let address = '';
      
      if (url.includes('restaurant')) {
        businessType = 'restaurant';
        const restaurantNames = [
          'Pacific Rim Cafe', 'Mountain View Diner', 'Riverside Grill', 'Summit Bistro',
          'Valley Kitchen', 'Harbor View Restaurant', 'Forest Glen Eatery'
        ];
        businessName = restaurantNames[Math.floor(Math.random() * restaurantNames.length)];
        address = `${1000 + Math.floor(Math.random() * 9000)} ${['Main St', 'First Ave', 'Pacific Ave', 'Center St'][Math.floor(Math.random() * 4)]}`;
      } else if (url.includes('medical')) {
        businessType = 'medical';
        const medicalNames = [
          'Regional Medical Center', 'Valley Clinic', 'Family Health Associates', 'Urgent Care Plus',
          'Summit Dental Group', 'Pacific Northwest Surgery', 'Community Health Center'
        ];
        businessName = medicalNames[Math.floor(Math.random() * medicalNames.length)];
        address = `${2000 + Math.floor(Math.random() * 8000)} ${['Medical Center Dr', 'Health Plaza', 'Hospital Way'][Math.floor(Math.random() * 3)]}`;
      } else if (url.includes('industrial')) {
        businessType = 'industrial';
        const industrialNames = [
          'Pacific Manufacturing', 'Northwest Fabrication', 'Valley Industrial Park', 'Summit Processing',
          'Regional Distribution Center', 'Advanced Materials Corp', 'Precision Manufacturing'
        ];
        businessName = industrialNames[Math.floor(Math.random() * industrialNames.length)];
        address = `${3000 + Math.floor(Math.random() * 7000)} ${['Industrial Blvd', 'Manufacturing Way', 'Distribution Dr'][Math.floor(Math.random() * 3)]}`;
      }
      
      const cities = ['Puyallup', 'Tacoma', 'Auburn', 'Federal Way', 'Sumner', 'Orting', 'Lakewood'];
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      mockData.push({
        businessName: `${businessName} ${i + 1}`,
        address: `${address}, ${city}, WA ${98000 + Math.floor(Math.random() * 500)}`,
        phone: `(253) 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        website: `https://${businessName.toLowerCase().replace(/ /g, '')}.com`,
        category: businessType,
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        source_url: url,
        scraped_at: new Date().toISOString()
      });
    }
    
    return mockData;
  }
}

// Data enrichment service
class DataEnrichmentService {
  static async enrichBusinessData(rawData: any): Promise<any> {
    // Estimate business details based on available information
    const businessType = this.classifyBusiness(rawData.businessName, rawData.category);
    const estimatedDevices = this.estimateDeviceCount(businessType, rawData.businessName);
    const estimatedValue = this.estimateContractValue(businessType, estimatedDevices);
    
    return {
      ...rawData,
      businessType,
      estimatedDevices,
      estimatedValue,
      complianceRisk: this.assessComplianceRisk(businessType),
      contactQuality: this.assessContactQuality(rawData),
      priorityScore: this.calculatePriorityScore(businessType, estimatedValue)
    };
  }
  
  private static classifyBusiness(name: string, category?: string): string {
    const text = `${name} ${category || ''}`.toLowerCase();
    
    for (const [type, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return type;
        }
      }
    }
    
    return 'other';
  }
  
  private static estimateDeviceCount(businessType: string, businessName: string): number {
    const baseCounts = {
      medical: 4,
      restaurant: 3,
      industrial: 8,
      office: 2,
      retail: 2
    };
    
    let baseCount = baseCounts[businessType as keyof typeof baseCounts] || 2;
    
    // Adjust based on business name indicators
    if (businessName.toLowerCase().includes('hospital') || businessName.toLowerCase().includes('medical center')) {
      baseCount *= 3;
    } else if (businessName.toLowerCase().includes('complex') || businessName.toLowerCase().includes('center')) {
      baseCount *= 2;
    }
    
    return baseCount;
  }
  
  private static estimateContractValue(businessType: string, deviceCount: number): number {
    const baseRates = {
      medical: 700,
      restaurant: 700,
      industrial: 700,
      office: 700,
      retail: 700
    };
    
    const rate = baseRates[businessType as keyof typeof baseRates] || 700;
    return deviceCount * rate;
  }
  
  private static assessComplianceRisk(businessType: string): string {
    const riskLevels = {
      medical: 'high',
      restaurant: 'high',
      industrial: 'medium',
      office: 'medium',
      retail: 'low'
    };
    
    return riskLevels[businessType as keyof typeof riskLevels] || 'medium';
  }
  
  private static assessContactQuality(data: any): string {
    let score = 0;
    
    if (data.phone) score += 40;
    if (data.website) score += 30;
    if (data.email) score += 30;
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
  
  private static calculatePriorityScore(businessType: string, estimatedValue: number): number {
    const typeScores = {
      medical: 95,
      restaurant: 90,
      industrial: 85,
      office: 70,
      retail: 60
    };
    
    let score = typeScores[businessType as keyof typeof typeScores] || 50;
    
    // Adjust for contract value
    if (estimatedValue > 3000) score += 5;
    else if (estimatedValue < 1000) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  }
}

// Main scraping orchestrator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      targets = ['google_maps', 'yelp'], 
      maxResults = 100,
      businessTypes = ['medical', 'restaurant', 'industrial'],
      location = 'Puyallup WA'
    } = body;
    
    console.log('Starting web scraping process:', { targets, maxResults, businessTypes, location });
    
    const scraper = new WebScraper();
    const allScrapedData: any[] = [];
    
    // Scrape Google Maps if requested
    if (targets.includes('google_maps')) {
      console.log('Scraping Google Maps business listings...');
      
      for (const businessType of businessTypes) {
        const searchUrl = `https://www.google.com/maps/search/${businessType}+near+${location}`;
        const results = await scraper.scrapeUrl(searchUrl, SCRAPING_TARGETS.GOOGLE_MAPS_BUSINESS.selectors);
        allScrapedData.push(...results);
      }
    }
    
    // Scrape Yelp if requested
    if (targets.includes('yelp')) {
      console.log('Scraping Yelp directory...');
      
      for (const businessType of businessTypes) {
        const searchUrl = `https://www.yelp.com/search?find_desc=${businessType}&find_loc=${location}`;
        const results = await scraper.scrapeUrl(searchUrl, SCRAPING_TARGETS.YELP_BUSINESS_DIRECTORY.selectors);
        allScrapedData.push(...results);
      }
    }
    
    // Scrape Yellow Pages if requested
    if (targets.includes('yellowpages')) {
      console.log('Scraping Yellow Pages...');
      
      for (const businessType of businessTypes) {
        const searchUrl = `https://www.yellowpages.com/search?search_terms=${businessType}&geo_location_terms=${location}`;
        const results = await scraper.scrapeUrl(searchUrl, SCRAPING_TARGETS.YELLOWPAGES.selectors);
        allScrapedData.push(...results);
      }
    }
    
    // Enrich the scraped data
    console.log('Enriching scraped data...');
    const enrichedData = await Promise.all(
      allScrapedData.map(data => DataEnrichmentService.enrichBusinessData(data))
    );
    
    // Remove duplicates based on business name and address
    const uniqueData = enrichedData.filter((business, index, array) => {
      return array.findIndex(b => 
        b.businessName === business.businessName && 
        b.address === business.address
      ) === index;
    });
    
    // Sort by priority score
    uniqueData.sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Limit results
    const limitedResults = uniqueData.slice(0, maxResults);
    
    // Calculate metrics
    const metrics = {
      total_scraped: allScrapedData.length,
      after_deduplication: uniqueData.length,
      final_results: limitedResults.length,
      by_business_type: Object.fromEntries(
        Object.keys(CLASSIFICATION_KEYWORDS).map(type => [
          type,
          limitedResults.filter(b => b.businessType === type).length
        ])
      ),
      average_priority_score: limitedResults.reduce((sum, b) => sum + b.priorityScore, 0) / limitedResults.length,
      contact_quality_distribution: {
        high: limitedResults.filter(b => b.contactQuality === 'high').length,
        medium: limitedResults.filter(b => b.contactQuality === 'medium').length,
        low: limitedResults.filter(b => b.contactQuality === 'low').length
      }
    };
    
    return NextResponse.json({
      success: true,
      message: `Successfully scraped ${limitedResults.length} business prospects`,
      results: limitedResults,
      metrics,
      configuration: {
        targets_scraped: targets,
        business_types: businessTypes,
        location,
        rate_limits: RATE_LIMITS
      }
    });
    
  } catch (error) {
    console.error('Web scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute web scraping process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for scraper status and configuration
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      available_targets: Object.keys(SCRAPING_TARGETS),
      supported_business_types: Object.keys(CLASSIFICATION_KEYWORDS),
      rate_limits: RATE_LIMITS,
      user_agents: USER_AGENTS.length,
      classification_keywords: CLASSIFICATION_KEYWORDS
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get scraper configuration' },
      { status: 500 }
    );
  }
}