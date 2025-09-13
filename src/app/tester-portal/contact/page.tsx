'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/tester-portal" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">Contact Us</h1>
        </div>
        
        <div className="glass-card p-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300">This page is currently being developed.</p>
          </div>
        </div>
      </div>
    </div>
  )
}