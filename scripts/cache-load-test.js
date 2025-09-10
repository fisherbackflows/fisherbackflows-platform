#!/usr/bin/env node

/**
 * Cache Load Testing Script
 * Tests cache behavior under heavy load conditions
 */

const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
const STRESS_TEST_DURATION = 30000; // 30 seconds
const WORKERS = 4;
const REQUESTS_PER_WORKER = 100;

class LoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      cacheHitRate: 0,
      errors: [],
      performanceMetrics: {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      }
    };
  }

  async runWorker(workerId, requestCount) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { workerId, requestCount, baseUrl: BASE_URL }
      });

      worker.on('message', (data) => {
        if (data.type === 'result') {
          resolve(data.results);
        }
      });

      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  calculatePercentiles(sortedTimes) {
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    return { p50, p90, p95, p99 };
  }

  async runLoadTest() {
    console.log('🚀 Starting cache load test...');
    console.log(`Workers: ${WORKERS}`);
    console.log(`Requests per worker: ${REQUESTS_PER_WORKER}`);
    console.log(`Total requests: ${WORKERS * REQUESTS_PER_WORKER}`);
    console.log(`Target URL: ${BASE_URL}\n`);

    const startTime = performance.now();
    
    // Clear cache before starting
    try {
      const response = await fetch(`${BASE_URL}/api/admin/cache/invalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tag', target: 'availability' })
      });
      console.log('✅ Cache cleared for clean test');
    } catch (error) {
      console.log('⚠️ Could not clear cache:', error.message);
    }

    // Launch workers
    const workerPromises = [];
    for (let i = 0; i < WORKERS; i++) {
      workerPromises.push(this.runWorker(i, REQUESTS_PER_WORKER));
    }

    console.log('⏳ Running load test...');
    const workerResults = await Promise.all(workerPromises);
    const totalTime = performance.now() - startTime;

    // Aggregate results
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    let cacheHits = 0;
    let allResponseTimes = [];
    let allErrors = [];

    workerResults.forEach(result => {
      totalRequests += result.totalRequests;
      successfulRequests += result.successfulRequests;
      failedRequests += result.failedRequests;
      totalResponseTime += result.totalResponseTime;
      cacheHits += result.cacheHits;
      allResponseTimes = allResponseTimes.concat(result.responseTimes);
      allErrors = allErrors.concat(result.errors);
    });

    // Calculate metrics
    const averageResponseTime = totalResponseTime / successfulRequests;
    const requestsPerSecond = totalRequests / (totalTime / 1000);
    const cacheHitRate = (cacheHits / successfulRequests) * 100;
    
    // Sort response times for percentile calculation
    allResponseTimes.sort((a, b) => a - b);
    const percentiles = this.calculatePercentiles(allResponseTimes);

    this.results = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      requestsPerSecond,
      cacheHitRate,
      errors: allErrors,
      performanceMetrics: percentiles,
      testDuration: totalTime,
      successRate: (successfulRequests / totalRequests) * 100
    };

    this.printResults();
    this.validatePerformance();
    
    return this.results;
  }

  printResults() {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${this.results.successRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Requests per Second: ${this.results.requestsPerSecond.toFixed(2)}`);
    console.log(`Cache Hit Rate: ${this.results.cacheHitRate.toFixed(2)}%`);
    console.log(`Test Duration: ${this.results.testDuration.toFixed(2)}ms`);
    
    console.log('\n📈 RESPONSE TIME PERCENTILES');
    console.log(`P50 (median): ${this.results.performanceMetrics.p50.toFixed(2)}ms`);
    console.log(`P90: ${this.results.performanceMetrics.p90.toFixed(2)}ms`);
    console.log(`P95: ${this.results.performanceMetrics.p95.toFixed(2)}ms`);
    console.log(`P99: ${this.results.performanceMetrics.p99.toFixed(2)}ms`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS');
      const errorCounts = {};
      this.results.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`${error}: ${count} times`);
      });
    }
  }

  validatePerformance() {
    console.log('\n✅ PERFORMANCE VALIDATION');
    console.log('='.repeat(50));
    
    const validations = {
      highSuccessRate: this.results.successRate >= 99,
      lowAverageResponseTime: this.results.averageResponseTime <= 150,
      highThroughput: this.results.requestsPerSecond >= 50,
      goodCacheHitRate: this.results.cacheHitRate >= 60,
      acceptableP95: this.results.performanceMetrics.p95 <= 300,
      acceptableP99: this.results.performanceMetrics.p99 <= 500
    };

    console.log(`Success Rate ≥99%: ${validations.highSuccessRate ? '✅' : '❌'} (${this.results.successRate.toFixed(2)}%)`);
    console.log(`Avg Response ≤150ms: ${validations.lowAverageResponseTime ? '✅' : '❌'} (${this.results.averageResponseTime.toFixed(2)}ms)`);
    console.log(`Throughput ≥50 req/s: ${validations.highThroughput ? '✅' : '❌'} (${this.results.requestsPerSecond.toFixed(2)} req/s)`);
    console.log(`Cache Hit Rate ≥60%: ${validations.goodCacheHitRate ? '✅' : '❌'} (${this.results.cacheHitRate.toFixed(2)}%)`);
    console.log(`P95 ≤300ms: ${validations.acceptableP95 ? '✅' : '❌'} (${this.results.performanceMetrics.p95.toFixed(2)}ms)`);
    console.log(`P99 ≤500ms: ${validations.acceptableP99 ? '✅' : '❌'} (${this.results.performanceMetrics.p99.toFixed(2)}ms)`);

    const allPassed = Object.values(validations).every(v => v);
    console.log(`\n🏆 OVERALL LOAD TEST: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

    return allPassed;
  }
}

// Worker thread code
async function workerTask() {
  const { workerId, requestCount, baseUrl } = workerData;
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    responseTimes: [],
    errors: []
  };

  const endpoints = [
    '/api/appointments/available-dates',
    '/api/appointments/available-times?date=2025-01-15',
    '/api/appointments/available-times?date=2025-01-16',
    '/api/appointments/available-times?date=2025-01-17'
  ];

  for (let i = 0; i < requestCount; i++) {
    const endpoint = endpoints[i % endpoints.length];
    const url = `${baseUrl}${endpoint}`;
    
    const start = performance.now();
    try {
      const response = await fetch(url);
      const data = await response.json();
      const duration = performance.now() - start;
      
      results.totalRequests++;
      if (response.ok) {
        results.successfulRequests++;
        results.totalResponseTime += duration;
        results.responseTimes.push(duration);
        
        if (data.cached) {
          results.cacheHits++;
        }
      } else {
        results.failedRequests++;
        results.errors.push(`HTTP ${response.status}`);
      }
    } catch (error) {
      const duration = performance.now() - start;
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push(error.message);
    }

    // Small delay to prevent overwhelming the server
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  parentPort.postMessage({ type: 'result', results });
}

// Main execution
if (isMainThread) {
  const tester = new LoadTester();
  tester.runLoadTest().then((results) => {
    // Save detailed report
    const fs = require('fs');
    const reportPath = `cache-load-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      configuration: { WORKERS, REQUESTS_PER_WORKER },
      results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('✅ Load test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
} else {
  workerTask();
}