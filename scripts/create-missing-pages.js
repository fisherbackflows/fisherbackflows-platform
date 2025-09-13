#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const pages = [
  {
    path: 'src/app/tester-portal/customers/import/page.tsx',
    title: 'Import Customers',
    backLink: '/tester-portal/customers',
    description: 'Import customers from CSV or Excel file'
  },
  {
    path: 'src/app/tester-portal/invoices/new/page.tsx',
    title: 'Create Invoice',
    backLink: '/tester-portal/invoices',
    description: 'Create a new invoice for a customer'
  },
  {
    path: 'src/app/tester-portal/reminders/new/page.tsx',
    title: 'Create Reminder',
    backLink: '/tester-portal/reminders',
    description: 'Set up a new reminder for testing or maintenance'
  },
  {
    path: 'src/app/tester-portal/schedule/new/page.tsx',
    title: 'Schedule Appointment',
    backLink: '/tester-portal/schedule',
    description: 'Schedule a new testing appointment'
  },
  {
    path: 'src/app/tester-portal/compliance/districts/page.tsx',
    title: 'District Compliance',
    backLink: '/tester-portal/reports',
    description: 'Water district compliance and reporting'
  }
];

const pageTemplate = (title, backLink, description) => `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function ${title.replace(/\s+/g, '')}Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // TODO: Implement submission logic
    setTimeout(() => {
      router.push('${backLink}')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="${backLink}" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-3xl font-bold">${title}</h1>
          <p className="text-gray-400 mt-2">${description}</p>
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
              href="${backLink}"
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
}`;

async function createPages() {
  console.log('📝 Creating missing pages...\n');
  
  for (const page of pages) {
    try {
      const filePath = path.join(process.cwd(), page.path);
      const content = pageTemplate(page.title, page.backLink, page.description);
      
      await fs.writeFile(filePath, content);
      console.log(`✅ Created: ${page.path}`);
    } catch (error) {
      console.log(`❌ Error creating ${page.path}: ${error.message}`);
    }
  }
  
  console.log('\n✨ Done!');
}

createPages().catch(console.error);