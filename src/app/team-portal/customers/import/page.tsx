'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'

interface CustomerRow {
  email: string
  first_name: string
  last_name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  company_name?: string
  property_type?: string
}

export default function ImportCustomersPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<CustomerRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [results, setResults] = useState<{
    total: number
    successful: number
    failed: number
    errors: string[]
  } | null>(null)

  const downloadTemplate = () => {
    const template = `email,first_name,last_name,phone,company_name,address,city,state,zip,property_type
john.doe@example.com,John,Doe,(555) 123-4567,ABC Company,123 Main St,Seattle,WA,98101,commercial
jane.smith@example.com,Jane,Smith,(555) 234-5678,,456 Oak Ave,Tacoma,WA,98402,residential`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview([])
      setErrors([])
      setResults(null)
      parseFile(selectedFile)
    }
  }

  const parseFile = (file: File) => {
    setParsing(true)
    setErrors([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validationErrors: string[] = []
        const validRows: CustomerRow[] = []

        results.data.forEach((row: any, index) => {
          // Validate required fields
          if (!row.email || !row.first_name || !row.last_name) {
            validationErrors.push(`Row ${index + 2}: Missing required fields (email, first_name, last_name)`)
            return
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(row.email)) {
            validationErrors.push(`Row ${index + 2}: Invalid email format (${row.email})`)
            return
          }

          validRows.push({
            email: row.email.toLowerCase().trim(),
            first_name: row.first_name.trim(),
            last_name: row.last_name.trim(),
            phone: row.phone?.trim() || undefined,
            company_name: row.company_name?.trim() || undefined,
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            state: row.state?.trim() || undefined,
            zip: row.zip?.trim() || undefined,
            property_type: row.property_type?.toLowerCase().trim() || 'residential'
          })
        })

        setErrors(validationErrors)
        setPreview(validRows.slice(0, 5)) // Show first 5 rows as preview
        setParsing(false)
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`])
        setParsing(false)
      }
    })
  }

  const handleImport = async () => {
    if (!file || errors.length > 0) return

    setImporting(true)
    setResults(null)

    // Re-parse the full file for import
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        const customers: CustomerRow[] = []
        
        parseResults.data.forEach((row: any) => {
          if (row.email && row.first_name && row.last_name) {
            customers.push({
              email: row.email.toLowerCase().trim(),
              first_name: row.first_name.trim(),
              last_name: row.last_name.trim(),
              phone: row.phone?.trim() || undefined,
              company_name: row.company_name?.trim() || undefined,
              address: row.address?.trim() || undefined,
              city: row.city?.trim() || undefined,
              state: row.state?.trim() || undefined,
              zip: row.zip?.trim() || undefined,
              property_type: row.property_type?.toLowerCase().trim() || 'residential'
            })
          }
        })

        try {
          const response = await fetch('/api/team/customers/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers })
          })

          const data = await response.json()

          if (response.ok) {
            setResults({
              total: data.total,
              successful: data.successful,
              failed: data.failed,
              errors: data.errors || []
            })
          } else {
            setErrors([data.error || 'Import failed'])
          }
        } catch (error) {
          setErrors(['Network error. Please try again.'])
        } finally {
          setImporting(false)
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/team-portal/customers" className="inline-flex items-center text-blue-300 hover:text-white/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Import Customers</h1>
          <p className="text-white/70">Bulk import your existing customer base from a CSV file</p>
        </div>

        {/* Import Steps */}
        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 glass-btn-primary glow-blue rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Download CSV Template</h3>
                <p className="text-white/70 mb-4">
                  Start with our template to ensure your data is formatted correctly
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 glass-btn-primary glow-blue hover:glow-blue text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 glass-btn-primary glow-blue rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Upload Your CSV File</h3>
                <p className="text-white/70 mb-4">
                  Select your customer CSV file with the required fields
                </p>
                
                <div className="border-2 border-dashed border-blue-400/50 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-blue-300 mb-3" />
                    <span className="text-white font-medium">
                      {file ? file.name : 'Click to upload CSV file'}
                    </span>
                    <span className="text-white/50 text-sm mt-1">
                      or drag and drop
                    </span>
                  </label>
                </div>

                {/* File Info */}
                {file && (
                  <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400 glow-blue-sm rounded-lg">
                    <p className="text-blue-300 text-sm">
                      Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}

                {/* Validation Errors */}
                {errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-center text-red-300 mb-2">
                      <XCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Validation Errors</span>
                    </div>
                    <ul className="text-red-200 text-sm space-y-1">
                      {errors.slice(0, 5).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {errors.length > 5 && (
                        <li>• ... and {errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Preview */}
                {preview.length > 0 && errors.length === 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Preview (first 5 rows)</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left text-white/70 pb-2">Email</th>
                            <th className="text-left text-white/70 pb-2">Name</th>
                            <th className="text-left text-white/70 pb-2">Phone</th>
                            <th className="text-left text-white/70 pb-2">Company</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-b border-white/10">
                              <td className="text-white/90 py-2">{row.email}</td>
                              <td className="text-white/90 py-2">{row.first_name} {row.last_name}</td>
                              <td className="text-white/90 py-2">{row.phone || '-'}</td>
                              <td className="text-white/90 py-2">{row.company_name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Import */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 glass-btn-primary glow-blue rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Import Customers</h3>
                <p className="text-white/70 mb-4">
                  Review the preview and start the import process
                </p>
                
                <button
                  onClick={handleImport}
                  disabled={!file || errors.length > 0 || importing || parsing}
                  className="px-6 py-2 glass-btn-primary glow-blue hover:glow-blue text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>

                {/* Import Results */}
                {results && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    results.failed === 0 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : 'bg-yellow-500/20 border border-yellow-500/50'
                  }`}>
                    <div className="flex items-center mb-2">
                      {results.failed === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-300 mr-2" />
                      )}
                      <span className="text-white font-medium">Import Complete</span>
                    </div>
                    <div className="text-white/90 space-y-1">
                      <p>Total Records: {results.total}</p>
                      <p>Successfully Imported: {results.successful}</p>
                      {results.failed > 0 && <p>Failed: {results.failed}</p>}
                    </div>
                    {results.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-white/70 text-sm mb-1">Errors:</p>
                        <ul className="text-white/60 text-sm space-y-1">
                          {results.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}