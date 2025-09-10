import { NextRequest, NextResponse } from 'next/server';
import { cacheAuditor } from '@/lib/cache-auditor';

export async function POST(request: NextRequest) {
  try {
    const auditResults = await cacheAuditor.runCompleteAudit();
    
    return NextResponse.json({
      success: true,
      audit: auditResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache audit failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Cache audit failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    // Run a quick audit or return cached results
    const auditResults = await cacheAuditor.runCompleteAudit();
    
    if (format === 'export') {
      const exportData = cacheAuditor.exportResults();
      
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="cache-audit-${Date.now()}.json"`
        }
      });
    }
    
    return NextResponse.json(auditResults);
    
  } catch (error) {
    console.error('Cache audit export failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Cache audit export failed'
    }, { status: 500 });
  }
}