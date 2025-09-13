'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function ScheduleAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Implement submission logic
    setTimeout(() => {
      router.push('/tester-portal/schedule')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tester-portal/schedule" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">Schedule Appointment</h1>
          <p className="text-gray-400 mt-2">Schedule a new testing appointment</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <div className="text-center py-12 text-gray-400">
            <p>This page is under construction.</p>
            <p className="mt-2">Implementation coming soon.</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
            <Link
              href="/tester-portal/schedule"
              className="px-6 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}