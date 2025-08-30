import Link from 'next/link'

export default function FieldPortal() {
  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-20"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5"></div>
      
      <header className="relative z-10 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold gradient-text">Field Portal</h1>
            <Link href="/" className="btn-glass px-4 py-2 rounded-lg hover-glow">
              ← Home
            </Link>
          </div>
        </div>
      </header>
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block glass-green rounded-full p-6 mb-6 pulse-glow">
              <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">Field Technician Portal</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Access your daily schedule, complete tests, and manage appointments on the go.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className="glass-green rounded-lg p-3 mr-4">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Technician Login</h3>
              </div>
              <p className="text-white/60 mb-6">Access your personalized dashboard and daily schedule</p>
              <Link href="/field/login" className="btn-glow w-full py-3 rounded-lg text-center block">
                Login to Field App
              </Link>
            </div>
            
            <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className="glass-green rounded-lg p-3 mr-4">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Quick Access</h3>
              </div>
              <p className="text-white/60 mb-6">Jump directly to your daily tasks and appointments</p>
              <Link href="/field/dashboard" className="btn-glass w-full py-3 rounded-lg text-center block hover-glow">
                View Dashboard
              </Link>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">Field Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="glass-green rounded-lg p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4h0l.95 10.95c.1.95-.8 1.05-1.9 1.05H6.95c-1.1 0-2-.1-1.9-1.05L6 7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">Test Equipment</h4>
                <p className="text-white/60 text-sm">Digital test forms and equipment tracking</p>
              </div>
              
              <div className="text-center">
                <div className="glass-green rounded-lg p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">Real-time Sync</h4>
                <p className="text-white/60 text-sm">Instant updates to office systems</p>
              </div>
              
              <div className="text-center">
                <div className="glass-green rounded-lg p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">Route Planning</h4>
                <p className="text-white/60 text-sm">Optimized daily routes and navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}