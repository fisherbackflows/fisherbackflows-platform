import { Metadata } from 'next'
import { UnifiedLayout } from '@/components/ui/UnifiedLayout'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Fisher Backflows',
  description: 'Business analytics and performance insights for Fisher Backflows'
}

export default function AnalyticsPage() {
  return (
    <UnifiedLayout variant="wide" background="gradient">
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-300">
            Track business performance and gain insights into your operations
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </UnifiedLayout>
  )
}