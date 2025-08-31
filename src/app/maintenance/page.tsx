'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/ui/Logo';
import { 
  Settings, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Clock,
  Wrench
} from 'lucide-react';

export default function MaintenancePage() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: adminCode }),
      });

      if (response.ok) {
        // Redirect to team portal
        window.location.href = '/team-portal';
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid access code');
      }
    } catch (error) {
      console.error('Admin access error:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo width={200} height={160} priority className="mx-auto mb-6" />
          </div>

          {/* Main Maintenance Message */}
          <div className="glass rounded-2xl p-8 glow-blue-sm text-center mb-6">
            <div className="inline-block glass-yellow rounded-full p-4 mb-6">
              <Wrench className="h-12 w-12 text-yellow-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">
              Platform Under Development
            </h1>
            
            <p className="text-white/80 mb-6">
              Fisher Backflows is currently updating our platform to serve you better. 
              We'll be back online soon with enhanced features and improved performance.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-white/60 mb-6">
              <Clock className="h-4 w-4" />
              <span>Expected completion: Soon</span>
            </div>

            <div className="text-sm text-white/60">
              For urgent backflow testing needs, please call:
              <div className="text-lg font-bold text-blue-400 mt-1">
                (253) 278-8692
              </div>
            </div>
          </div>

          {/* Admin Access Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-white/40 hover:text-white/60 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Admin Access
            </Button>
          </div>

          {/* Admin Login Form */}
          {showAdminLogin && (
            <div className="mt-4 glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-400" />
                Administrator Access
              </h3>
              
              <form onSubmit={handleAdminAccess}>
                <div className="mb-4">
                  <Input
                    type="password"
                    placeholder="Enter admin access code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="bg-gray-800/50 border-gray-600"
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-red-400 text-sm mb-4">{error}</div>
                )}
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-700 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      Access Platform
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Contact Information */}
          <div className="mt-8 text-center text-xs text-white/40">
            <p>Fisher Backflows - Professional Backflow Prevention Services</p>
            <p className="mt-1">Pierce County, Washington</p>
          </div>
        </div>
      </div>
    </div>
  );
}