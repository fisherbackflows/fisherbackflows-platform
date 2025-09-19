'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  Star,
  Shield,
  CheckCircle,
  ArrowRight,
  Clock
} from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface Company {
  id: string
  name: string
  slug: string
  description: string
  logo_url?: string
  primary_color: string
  contact_email?: string
  contact_phone?: string
  address?: string
  service_areas: string[]
  portal_url: string
}

function CompanyDirectoryPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  
  // Get unique service areas
  const serviceAreas = [...new Set(companies.flatMap(c => c.service_areas))].sort()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [searchTerm, selectedArea, companies])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/portal/directory')
      const data = await response.json()
      
      if (response.ok && data.success) {
        setCompanies(data.data)
      } else {
        console.error('Failed to fetch companies:', data.error)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCompanies = () => {
    let filtered = companies

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.description.toLowerCase().includes(term) ||
        company.address?.toLowerCase().includes(term)
      )
    }

    if (selectedArea) {
      filtered = filtered.filter(company =>
        company.service_areas.includes(selectedArea)
      )
    }

    setFilteredCompanies(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto glow-blue"></div>
          <p className="mt-4 text-white/80">Loading testing companies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find Your Backflow Testing Company
            </h1>
            <p className="text-xl text-blue-300 max-w-3xl mx-auto">
              Choose a certified backflow testing company in your area. All companies are licensed, 
              insured, and provide digital reports with water district submissions.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 glass border border-blue-400 rounded-2xl p-6 glow-blue">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search by company name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-400 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-400 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
              >
                <option value="">All Service Areas</option>
                {serviceAreas.map(area => (
                  <option key={area} value={area} className="bg-white text-black">
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-white/80">
              <Shield className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-sm">All companies certified & insured</span>
            </div>
          </div>
        </div>

        {/* Company Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div 
              key={company.id}
              className="glass border border-blue-400 rounded-2xl p-6 hover:scale-105 transition-all duration-200 hover:glow-blue"
            >
              {/* Company Header */}
              <div className="flex items-center space-x-4 mb-4">
                {company.logo_url ? (
                  <div className="relative w-16 h-16">
                    <Image
                      src={company.logo_url}
                      alt={`${company.name} Logo`}
                      width={64}
                      height={64}
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: company.primary_color }}
                  >
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{company.name}</h3>
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Certified & Insured</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/80 mb-4 leading-relaxed">
                {company.description}
              </p>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {company.address && (
                  <div className="flex items-center text-blue-300 text-sm">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{company.address}</span>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="flex items-center text-blue-300 text-sm">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a href={`tel:${company.contact_phone}`} className="hover:text-blue-400 transition-colors">
                      {company.contact_phone}
                    </a>
                  </div>
                )}
                {company.contact_email && (
                  <div className="flex items-center text-blue-300 text-sm">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <a href={`mailto:${company.contact_email}`} className="hover:text-blue-400 transition-colors">
                      {company.contact_email}
                    </a>
                  </div>
                )}
              </div>

              {/* Service Areas */}
              {company.service_areas.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/60 text-xs mb-2">Service Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {company.service_areas.slice(0, 3).map(area => (
                      <span 
                        key={area}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-400/30"
                      >
                        {area}
                      </span>
                    ))}
                    {company.service_areas.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full border border-white/20">
                        +{company.service_areas.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link
                href={company.portal_url}
                className="block w-full text-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 text-white hover:scale-105 glass-btn-primary glow-blue"
              >
                <span className="flex items-center justify-center">
                  Access Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCompanies.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="glass border border-blue-400 rounded-2xl p-8 max-w-md mx-auto glow-blue">
              <Search className="h-16 w-16 text-blue-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Companies Found</h3>
              <p className="text-white/80 mb-4">
                Try adjusting your search terms or service area filter.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedArea('')
                }}
                className="text-blue-300 hover:text-blue-400 font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 glass border border-blue-400 rounded-2xl p-6 glow-blue">
          <div className="text-center">
            <Clock className="h-8 w-8 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Need Help Finding a Company?</h3>
            <p className="text-white/80 mb-4">
              Can't find a testing company in your area? We can help connect you with certified professionals.
            </p>
            <Link
              href="mailto:support@fisherbackflows.com"
              className="inline-flex items-center px-6 py-3 glass-btn-primary glow-blue text-white rounded-xl font-semibold transition-all duration-200"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompanyDirectoryPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <CompanyDirectoryPage />
    </ErrorBoundary>
  )
}