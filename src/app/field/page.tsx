import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { User, ClipboardList, ArrowLeft, Wrench, BarChart3, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FieldPortal() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <Logo width={160} height={128} />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                  <p className="text-xs text-slate-800">Field Portal</p>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/" className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 font-medium transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2 inline" />
                  Home
                </Link>
              </nav>
            </div>
            <div className="text-sm text-slate-800">
              Field Operations
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex p-6 bg-green-300 rounded-2xl mb-8">
            <Wrench className="h-16 w-16 text-green-800" />
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mb-6">Field Technician Portal</h2>
          <p className="text-xl text-slate-800 max-w-3xl mx-auto leading-relaxed">
            Mobile-optimized platform for field technicians to access schedules, complete tests, and manage appointments efficiently in the field.
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-4 bg-green-300 rounded-xl mr-4">
                <User className="h-8 w-8 text-green-800" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Technician Login</h3>
                <p className="text-slate-800">Secure access for certified technicians</p>
              </div>
            </div>
            <p className="text-slate-800 mb-8 leading-relaxed">
              Access your personalized dashboard with today's appointments, customer information, and mobile-optimized test forms.
            </p>
            <Button asChild className="w-full bg-green-700 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl">
              <Link href="/field/login">
                <User className="h-5 w-5 mr-3" />
                Login to Field App
              </Link>
            </Button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-4 bg-blue-300 rounded-xl mr-4">
                <ClipboardList className="h-8 w-8 text-blue-800" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Quick Access</h3>
                <p className="text-slate-800">Jump directly to field operations</p>
              </div>
            </div>
            <p className="text-slate-800 mb-8 leading-relaxed">
              View your daily schedule, appointment details, customer contact information, and access mobile testing tools.
            </p>
            <Button variant="outline" asChild className="w-full border-slate-300 text-slate-700 hover:bg-slate-400 py-4 text-lg font-semibold rounded-xl">
              <Link href="/field/dashboard">
                <ClipboardList className="h-5 w-5 mr-3" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-slate-400 rounded-2xl p-12 border border-slate-200">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Field App Features</h3>
            <p className="text-slate-800 text-lg">Professional tools designed for efficient field operations</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-6 bg-green-300 rounded-2xl mb-6">
                <Wrench className="h-12 w-12 text-green-800" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Digital Test Forms</h4>
              <p className="text-slate-800 leading-relaxed">
                Mobile-optimized digital forms for backflow testing with automatic calculations and instant report generation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-6 bg-blue-300 rounded-2xl mb-6">
                <BarChart3 className="h-12 w-12 text-blue-800" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Real-time Sync</h4>
              <p className="text-slate-800 leading-relaxed">
                Instant synchronization with office systems for immediate report submission and customer updates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-6 bg-purple-100 rounded-2xl mb-6">
                <MapPin className="h-12 w-12 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Route Optimization</h4>
              <p className="text-slate-800 leading-relaxed">
                Smart route planning with GPS navigation and optimized scheduling for maximum efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Optimization Notice */}
        <div className="mt-12 text-center">
          <div className="bg-green-200 border border-green-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-green-800 mb-2">📱 Mobile-First Design</h4>
            <p className="text-green-700">
              This field portal is optimized for mobile devices and tablets for easy use in the field
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}