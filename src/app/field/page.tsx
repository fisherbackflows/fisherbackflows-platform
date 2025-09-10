import Link from 'next/link'
import { FieldNavigation } from '@/components/navigation/UnifiedNavigation'
import { User, ClipboardList, Wrench, BarChart3, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FieldPortal() {
  return (
    <div className="min-h-screen bg-black">
      <FieldNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex p-6 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-2xl mb-8">
            <Wrench className="h-16 w-16 text-green-300" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">Field Technician Portal</h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Mobile-optimized platform for field technicians to access schedules, complete tests, and manage appointments efficiently in the field.
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue hover:glow-blue-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-4 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-xl mr-4">
                <User className="h-8 w-8 text-green-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Technician Login</h3>
                <p className="text-white/90">Secure access for certified technicians</p>
              </div>
            </div>
            <p className="text-white/90 mb-8 leading-relaxed">
              Access your personalized dashboard with today's appointments, customer information, and mobile-optimized test forms.
            </p>
            <Button asChild className="w-full glass-btn-primary hover:glow-blue bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/30 border-green-400 text-white py-4 text-lg font-semibold rounded-xl">
              <Link href="/field/login">
                <User className="h-5 w-5 mr-3" />
                Login to Field App
              </Link>
            </Button>
          </div>
          
          <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue hover:glow-blue-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-xl mr-4">
                <ClipboardList className="h-8 w-8 text-blue-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Quick Access</h3>
                <p className="text-white/90">Jump directly to field operations</p>
              </div>
            </div>
            <p className="text-white/90 mb-8 leading-relaxed">
              View your daily schedule, appointment details, customer contact information, and access mobile testing tools.
            </p>
            <Button variant="outline" asChild className="w-full border-blue-400 text-white/80 hover:glass py-4 text-lg font-semibold rounded-xl">
              <Link href="/field/dashboard">
                <ClipboardList className="h-5 w-5 mr-3" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="glass rounded-2xl p-12 border border-blue-400">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Field App Features</h3>
            <p className="text-white/90 text-lg">Professional tools designed for efficient field operations</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-6 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-2xl mb-6">
                <Wrench className="h-12 w-12 text-green-300" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Digital Test Forms</h4>
              <p className="text-white/90 leading-relaxed">
                Mobile-optimized digital forms for backflow testing with automatic calculations and instant report generation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-6 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl mb-6">
                <BarChart3 className="h-12 w-12 text-blue-300" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Real-time Sync</h4>
              <p className="text-white/90 leading-relaxed">
                Instant synchronization with office systems for immediate report submission and customer updates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex p-6 bg-purple-500/20 border border-purple-400 glow-blue-sm rounded-2xl mb-6">
                <MapPin className="h-12 w-12 text-purple-300" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Route Optimization</h4>
              <p className="text-white/90 leading-relaxed">
                Smart route planning with GPS navigation and optimized scheduling for maximum efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Optimization Notice */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-green-300 mb-2">📱 Mobile-First Design</h4>
            <p className="text-green-700">
              This field portal is optimized for mobile devices and tablets for easy use in the field
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}