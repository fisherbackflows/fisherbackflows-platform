#!/usr/bin/env node

/**
 * Cache Performance Testing Script
 * Validates real-world performance claims with actual API calls
 */

const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
const TEST_ITERATIONS = 50;
const CONCURRENT_REQUESTS = 10;

class PerformanceTester {
  constructor() {
    this.results = {
      withCache: [],
      withoutCache: [],
      errors: [],
      cacheHitRate: 0,
      summary: {}
    };
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url) {
    const start = performance.now();
    try {
      const response = await fetch(url);
      const data = await response.json();
      const duration = performance.now() - start;
      
      return {
        success: true,
        duration,
        cached: data.cached || false,
        timestamp: data.timestamp,
        data
      };
    } catch (error) {
      const duration = performance.now() - start;
      return {
        success: false,
        duration,
        error: error.message
      };
    }
  }

  async testAvailabilityEndpoints() {
    console.log('🧪 Testing cache performance on availability endpoints...\n');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];

    const endpoints = [
      '/api/appointments/available-dates',
      `/api/appointments/available-times?date=${testDate}`
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing: ${endpoint}`);
      
      // Clear cache first
      try {
        await fetch(`${BASE_URL}/api/admin/cache/invalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'availability', target: 'all' })
        });
        console.log('✅ Cache cleared');
      } catch (error) {
        console.log('⚠️ Could not clear cache:', error.message);
      }

      await this.delay(100); // Brief pause

      // Test cold cache (first request)
      console.log('Testing cold cache performance...');
      const coldRequests = [];
      for (let i = 0; i < 5; i++) {
        coldRequests.push(this.makeRequest(`${BASE_URL}${endpoint}`));
        await this.delay(10); // Slight delay between requests
      }
      const coldResults = await Promise.all(coldRequests);
      const avgColdTime = coldResults.reduce((sum, r) => sum + r.duration, 0) / coldResults.length;
      
      // Allow cache to warm up
      await this.delay(200);

      // Test warm cache (subsequent requests)
      console.log('Testing warm cache performance...');
      const warmRequests = [];
      for (let i = 0; i < 20; i++) {
        warmRequests.push(this.makeRequest(`${BASE_URL}${endpoint}`));
        await this.delay(5); // Quick successive requests
      }
      const warmResults = await Promise.all(warmRequests);
      const avgWarmTime = warmResults.reduce((sum, r) => sum + r.duration, 0) / warmResults.length;
      
      // Calculate cache hit rate
      const cacheHits = warmResults.filter(r => r.cached).length;
      const hitRate = (cacheHits / warmResults.length) * 100;
      
      // Calculate improvement
      const improvement = ((avgColdTime - avgWarmTime) / avgColdTime) * 100;
      
      console.log(`📊 Results for ${endpoint}:`);
      console.log(`   Cold cache avg: ${avgColdTime.toFixed(2)}ms`);
      console.log(`   Warm cache avg: ${avgWarmTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(2)}%`);
      console.log(`   Cache hit rate: ${hitRate.toFixed(2)}%`);
      console.log(`   Cache hits: ${cacheHits}/${warmResults.length}`);
      
      // Validate claims
      const claims = {
        improvementClaim: improvement > 50,
        hitRateClaim: hitRate > 70,
        responsivenessClaim: avgWarmTime < 100
      };
      
      console.log(`✅ Claims validation:`);
      console.log(`   >50% improvement: ${claims.improvementClaim ? '✅' : '❌'}`);
      console.log(`   >70% hit rate: ${claims.hitRateClaim ? '✅' : '❌'}`);
      console.log(`   <100ms response: ${claims.responsivenessClaim ? '✅' : '❌'}`);
      console.log('');

      // Store results
      this.results.summary[endpoint] = {
        avgColdTime,
        avgWarmTime,
        improvement,
        hitRate,
        cacheHits,
        totalRequests: warmResults.length,
        claims
      };
    }
  }

  async testConcurrentLoad() {
    console.log('🚀 Testing concurrent load performance...\n');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const testDate = tomorrow.toISOString().split('T')[0];
    const endpoint = `/api/appointments/available-times?date=${testDate}`;

    // Clear cache
    try {
      await fetch(`${BASE_URL}/api/admin/cache/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tag', target: 'availability' })
      });
    } catch (error) {
      console.log('⚠️ Could not clear cache');
    }

    // Test concurrent requests
    console.log(`Making ${CONCURRENT_REQUESTS} concurrent requests...`);
    const start = performance.now();
    
    const concurrentPromises = Array(CONCURRENT_REQUESTS).fill().map(() => 
      this.makeRequest(`${BASE_URL}${endpoint}`)
    );
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const totalTime = performance.now() - start;
    
    const successful = concurrentResults.filter(r => r.success).length;
    const failed = concurrentResults.length - successful;
    const avgResponseTime = concurrentResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0) / successful;
    
    console.log(`📊 Concurrent load results:`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Successful requests: ${successful}/${CONCURRENT_REQUESTS}`);
    console.log(`   Failed requests: ${failed}`);
    console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Requests per second: ${(CONCURRENT_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
    
    const concurrentClaims = {
      allSuccessful: failed === 0,
      fastResponse: avgResponseTime < 200,
      highThroughput: (CONCURRENT_REQUESTS / (totalTime / 1000)) > 20
    };
    
    console.log(`✅ Concurrent claims validation:`);
    console.log(`   No failures: ${concurrentClaims.allSuccessful ? '✅' : '❌'}`);
    console.log(`   <200ms avg response: ${concurrentClaims.fastResponse ? '✅' : '❌'}`);
    console.log(`   >20 req/sec: ${concurrentClaims.highThroughput ? '✅' : '❌'}`);
    
    this.results.concurrent = {
      totalTime,
      successful,
      failed,
      avgResponseTime,
      requestsPerSecond: CONCURRENT_REQUESTS / (totalTime / 1000),
      claims: concurrentClaims
    };
  }

  async testCacheInvalidation() {
    console.log('🔄 Testing cache invalidation correctness...\n');

    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 3);
    const dateStr = testDate.toISOString().split('T')[0];
    const endpoint = `/api/appointments/available-times?date=${dateStr}`;

    // First request (cache miss)
    const first = await this.makeRequest(`${BASE_URL}${endpoint}`);
    console.log(`First request: ${first.duration.toFixed(2)}ms (cached: ${first.cached})`);

    // Second request (cache hit)
    const second = await this.makeRequest(`${BASE_URL}${endpoint}`);
    console.log(`Second request: ${second.duration.toFixed(2)}ms (cached: ${second.cached})`);

    // Invalidate cache
    try {
      const invalidateResponse = await fetch(`${BASE_URL}/api/admin/cache/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'availability', target: dateStr })
      });
      const invalidateData = await invalidateResponse.json();
      console.log(`Cache invalidated: ${invalidateData.message}`);
    } catch (error) {
      console.log('⚠️ Could not invalidate cache:', error.message);
    }

    // Third request (cache miss after invalidation)
    const third = await this.makeRequest(`${BASE_URL}${endpoint}`);
    console.log(`Third request: ${third.duration.toFixed(2)}ms (cached: ${third.cached})`);

    const invalidationCorrect = !first.cached && second.cached && !third.cached;
    console.log(`✅ Invalidation correctness: ${invalidationCorrect ? '✅' : '❌'}`);

    this.results.invalidation = {
      firstRequest: { duration: first.duration, cached: first.cached },
      secondRequest: { duration: second.duration, cached: second.cached },
      thirdRequest: { duration: third.duration, cached: third.cached },
      invalidationCorrect
    };
  }

  async runFullTest() {
    console.log('🔍 Starting comprehensive cache performance audit...\n');
    console.log(`Testing against: ${BASE_URL}`);
    console.log(`Test iterations: ${TEST_ITERATIONS}`);
    console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}\n`);

    try {
      await this.testAvailabilityEndpoints();
      await this.testConcurrentLoad();
      await this.testCacheInvalidation();

      console.log('📋 FINAL AUDIT SUMMARY');
      console.log('='.repeat(50));
      
      // Overall validation
      const allEndpointsValid = Object.values(this.results.summary).every(endpoint => 
        Object.values(endpoint.claims).every(claim => claim)
      );
      
      const concurrentValid = Object.values(this.results.concurrent.claims).every(claim => claim);
      const invalidationValid = this.results.invalidation.invalidationCorrect;
      
      console.log(`Cache Performance Claims: ${allEndpointsValid ? '✅ VERIFIED' : '❌ FAILED'}`);
      console.log(`Concurrent Load Claims: ${concurrentValid ? '✅ VERIFIED' : '❌ FAILED'}`);
      console.log(`Invalidation Claims: ${invalidationValid ? '✅ VERIFIED' : '❌ FAILED'}`);
      
      const overallValid = allEndpointsValid && concurrentValid && invalidationValid;
      console.log(`\n🏆 OVERALL AUDIT RESULT: ${overallValid ? '✅ PASSED' : '❌ FAILED'}`);

      // Export results
      const reportPath = `cache-audit-report-${Date.now()}.json`;
      const fs = require('fs');
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        configuration: { TEST_ITERATIONS, CONCURRENT_REQUESTS },
        results: this.results,
        overallValid
      }, null, 2));
      
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runFullTest().then(() => {
    console.log('\n✅ Cache audit completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Cache audit failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTester;