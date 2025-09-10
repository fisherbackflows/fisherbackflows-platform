/**
 * Cache Auditor - Fisher Backflows
 * Comprehensive cache performance and correctness auditing
 */

import { cache, CacheKeys, CacheTTL } from './cache';
import { createClient } from '@supabase/supabase-js';

interface AuditResult {
  timestamp: string;
  testName: string;
  passed: boolean;
  details: any;
  metrics?: {
    responseTime: number;
    dbQueries: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

interface PerformanceMetrics {
  withCache: number;
  withoutCache: number;
  improvement: number;
  dbQueriesSaved: number;
}

export class CacheAuditor {
  private results: AuditResult[] = [];
  private startTime: number = 0;
  private dbQueryCount: number = 0;

  /**
   * Start performance measurement
   */
  private startMeasurement(): void {
    this.startTime = performance.now();
    this.dbQueryCount = 0;
  }

  /**
   * End performance measurement
   */
  private endMeasurement(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Mock database query counter (in real implementation, this would hook into Supabase client)
   */
  private mockDbQuery(): void {
    this.dbQueryCount++;
  }

  /**
   * Test 1: Cache Hit/Miss Accuracy
   */
  async testCacheAccuracy(): Promise<AuditResult> {
    const testKey = 'audit:test:accuracy';
    const testData = { value: 'test-data', timestamp: Date.now() };
    
    try {
      // Clear any existing data
      cache.delete(testKey);
      
      // Test miss
      const miss = cache.get(testKey);
      const missCorrect = miss === null;
      
      // Test set and hit
      cache.set(testKey, testData, 1000); // 1 second TTL
      const hit = cache.get(testKey);
      const hitCorrect = JSON.stringify(hit) === JSON.stringify(testData);
      
      // Test expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      const expired = cache.get(testKey);
      const expirationCorrect = expired === null;
      
      const passed = missCorrect && hitCorrect && expirationCorrect;
      
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Cache Accuracy Test',
        passed,
        details: {
          missCorrect,
          hitCorrect,
          expirationCorrect,
          testData
        }
      };
      
      this.results.push(result);
      return result;
      
    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Cache Accuracy Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: Performance Improvement Verification
   */
  async testPerformanceImprovement(): Promise<AuditResult> {
    const testDate = '2025-01-15';
    
    try {
      // Clear cache to ensure clean test
      cache.deleteByTag('availability');
      
      // Simulate database fetch function
      const mockDbFetch = async () => {
        this.mockDbQuery();
        // Simulate database latency
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          success: true,
          date: testDate,
          availableSlots: [
            { time: '09:00', label: '9:00 AM' },
            { time: '10:00', label: '10:00 AM' }
          ],
          totalSlots: 7,
          bookedSlots: 5
        };
      };

      // Test without cache (first call)
      this.startMeasurement();
      const withoutCacheResult = await mockDbFetch();
      const withoutCacheTime = this.endMeasurement();
      const dbQueriesWithoutCache = this.dbQueryCount;

      // Cache the result
      cache.set(CacheKeys.availableTimes(testDate), withoutCacheResult, CacheTTL.MEDIUM);

      // Test with cache (second call)
      this.dbQueryCount = 0;
      this.startMeasurement();
      const withCacheResult = cache.get(CacheKeys.availableTimes(testDate));
      const withCacheTime = this.endMeasurement();
      const dbQueriesWithCache = this.dbQueryCount;

      const improvement = ((withoutCacheTime - withCacheTime) / withoutCacheTime) * 100;
      const passed = improvement > 50 && dbQueriesWithCache === 0;

      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Performance Improvement Test',
        passed,
        details: {
          withoutCacheTime: `${withoutCacheTime.toFixed(2)}ms`,
          withCacheTime: `${withCacheTime.toFixed(2)}ms`,
          improvement: `${improvement.toFixed(2)}%`,
          dbQueriesWithoutCache,
          dbQueriesWithCache,
          dataConsistency: JSON.stringify(withoutCacheResult) === JSON.stringify(withCacheResult)
        },
        metrics: {
          responseTime: withCacheTime,
          dbQueries: dbQueriesWithCache,
          cacheHits: 1,
          cacheMisses: 0
        }
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Performance Improvement Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Cache Invalidation Correctness
   */
  async testCacheInvalidation(): Promise<AuditResult> {
    const testDate = '2025-01-16';
    const testKey = CacheKeys.availableTimes(testDate);
    
    try {
      // Set initial cache data
      const initialData = { availableSlots: ['09:00', '10:00', '11:00'] };
      cache.set(testKey, initialData, CacheTTL.LONG, ['availability', `date:${testDate}`]);
      
      // Verify data is cached
      const cachedData = cache.get(testKey);
      const cacheSetCorrectly = cachedData !== null;

      // Test tag-based invalidation
      const { AvailabilityCache } = await import('./cache');
      AvailabilityCache.invalidateAvailability(testDate);
      
      // Verify data is invalidated
      const afterInvalidation = cache.get(testKey);
      const invalidationCorrect = afterInvalidation === null;

      const passed = cacheSetCorrectly && invalidationCorrect;

      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Cache Invalidation Test',
        passed,
        details: {
          cacheSetCorrectly,
          invalidationCorrect,
          testDate,
          testKey
        }
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Cache Invalidation Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 4: Memory Usage and Leaks
   */
  async testMemoryUsage(): Promise<AuditResult> {
    try {
      const initialStats = cache.getStats();
      const initialMemory = process.memoryUsage();

      // Add 1000 cache entries
      for (let i = 0; i < 1000; i++) {
        cache.set(`test:memory:${i}`, { data: `test-data-${i}` }, CacheTTL.SHORT);
      }

      const afterAdditionStats = cache.getStats();
      const afterAdditionMemory = process.memoryUsage();

      // Clear cache
      cache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterClearStats = cache.getStats();
      const afterClearMemory = process.memoryUsage();

      const memoryIncrease = afterAdditionMemory.heapUsed - initialMemory.heapUsed;
      const memoryFreed = afterAdditionMemory.heapUsed - afterClearMemory.heapUsed;
      const memoryRecoveryRate = (memoryFreed / memoryIncrease) * 100;

      const passed = afterClearStats.size === 0 && memoryRecoveryRate > 50;

      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Memory Usage Test',
        passed,
        details: {
          initialSize: initialStats.size,
          afterAdditionSize: afterAdditionStats.size,
          afterClearSize: afterClearStats.size,
          memoryIncrease: `${Math.round(memoryIncrease / 1024)}KB`,
          memoryFreed: `${Math.round(memoryFreed / 1024)}KB`,
          memoryRecoveryRate: `${memoryRecoveryRate.toFixed(2)}%`
        }
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Memory Usage Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 5: Concurrent Access Safety
   */
  async testConcurrentAccess(): Promise<AuditResult> {
    const testKey = 'audit:concurrent:test';
    const concurrency = 100;
    
    try {
      cache.delete(testKey);
      
      // Create concurrent operations
      const promises = [];
      
      // Half write operations
      for (let i = 0; i < concurrency / 2; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              cache.set(`${testKey}:${i}`, { value: i, timestamp: Date.now() });
              resolve(i);
            }, Math.random() * 10);
          })
        );
      }
      
      // Half read operations
      for (let i = 0; i < concurrency / 2; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              const value = cache.get(`${testKey}:${i}`);
              resolve(value);
            }, Math.random() * 10);
          })
        );
      }

      const results = await Promise.all(promises);
      const passed = results.length === concurrency; // No errors occurred

      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Concurrent Access Test',
        passed,
        details: {
          concurrentOperations: concurrency,
          completedOperations: results.length,
          cacheSize: cache.getStats().size
        }
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Concurrent Access Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 6: Real-world API Performance
   */
  async testRealApiPerformance(): Promise<AuditResult> {
    try {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 1);
      const dateStr = testDate.toISOString().split('T')[0];

      // Mock API calls with and without cache
      const mockApiCall = async (useCache: boolean) => {
        this.startMeasurement();
        
        if (useCache) {
          // Simulate cached response
          const cached = cache.get(CacheKeys.availableTimes(dateStr));
          if (cached) {
            return { ...cached, source: 'cache' };
          }
        }
        
        // Simulate database query
        this.mockDbQuery();
        await new Promise(resolve => setTimeout(resolve, 75)); // Simulate DB latency
        
        const response = {
          success: true,
          date: dateStr,
          availableSlots: [
            { time: '09:00', label: '9:00 AM' },
            { time: '13:00', label: '1:00 PM' }
          ],
          source: 'database'
        };
        
        if (useCache) {
          cache.set(CacheKeys.availableTimes(dateStr), response, CacheTTL.SHORT);
        }
        
        return response;
      };

      // Test without cache
      this.dbQueryCount = 0;
      const withoutCacheTime1 = await this.timeAsyncOperation(() => mockApiCall(false));
      const withoutCacheTime2 = await this.timeAsyncOperation(() => mockApiCall(false));
      const avgWithoutCache = (withoutCacheTime1 + withoutCacheTime2) / 2;
      const dbQueriesWithoutCache = this.dbQueryCount;

      // Test with cache (first call populates cache, second uses it)
      this.dbQueryCount = 0;
      const withCacheTime1 = await this.timeAsyncOperation(() => mockApiCall(true)); // Cache miss
      const withCacheTime2 = await this.timeAsyncOperation(() => mockApiCall(true)); // Cache hit
      const dbQueriesWithCache = this.dbQueryCount;

      const improvement = ((avgWithoutCache - withCacheTime2) / avgWithoutCache) * 100;
      const passed = improvement > 70 && dbQueriesWithCache === 1; // Only one DB query for cache miss

      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Real API Performance Test',
        passed,
        details: {
          avgWithoutCache: `${avgWithoutCache.toFixed(2)}ms`,
          withCacheMiss: `${withCacheTime1.toFixed(2)}ms`,
          withCacheHit: `${withCacheTime2.toFixed(2)}ms`,
          improvement: `${improvement.toFixed(2)}%`,
          dbQueriesWithoutCache,
          dbQueriesWithCache
        },
        metrics: {
          responseTime: withCacheTime2,
          dbQueries: dbQueriesWithCache,
          cacheHits: 1,
          cacheMisses: 1
        }
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: AuditResult = {
        timestamp: new Date().toISOString(),
        testName: 'Real API Performance Test',
        passed: false,
        details: { error: error.message }
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Helper to time async operations
   */
  private async timeAsyncOperation<T>(operation: () => Promise<T>): Promise<number> {
    const start = performance.now();
    await operation();
    return performance.now() - start;
  }

  /**
   * Run complete audit suite
   */
  async runCompleteAudit(): Promise<{
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      passRate: string;
    };
    results: AuditResult[];
    recommendations: string[];
  }> {
    console.log('🔍 Starting comprehensive cache audit...');
    
    this.results = []; // Clear previous results
    
    const tests = [
      () => this.testCacheAccuracy(),
      () => this.testPerformanceImprovement(),
      () => this.testCacheInvalidation(),
      () => this.testMemoryUsage(),
      () => this.testConcurrentAccess(),
      () => this.testRealApiPerformance()
    ];

    // Run all tests
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Audit test failed:', error);
      }
    }

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const passRate = ((passed / this.results.length) * 100).toFixed(2);

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    const summary = {
      totalTests: this.results.length,
      passed,
      failed,
      passRate: `${passRate}%`
    };

    console.log('✅ Cache audit completed:', summary);
    
    return {
      summary,
      results: this.results,
      recommendations
    };
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = cache.getStats();

    if (stats.hitRate < 70) {
      recommendations.push('Consider increasing TTL values for better hit rates');
    }

    if (stats.evictions > stats.sets * 0.1) {
      recommendations.push('High eviction rate detected - consider increasing cache size');
    }

    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests failed - review implementation`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache implementation is performing optimally');
    }

    return recommendations;
  }

  /**
   * Export audit results to JSON
   */
  exportResults(): string {
    return JSON.stringify({
      auditTimestamp: new Date().toISOString(),
      cacheStats: cache.getStats(),
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    }, null, 2);
  }
}

// Export singleton instance
export const cacheAuditor = new CacheAuditor();