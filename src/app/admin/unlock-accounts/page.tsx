'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle,
  User,
  RefreshCw,
  Shield
} from 'lucide-react';

export default function UnlockAccountsPage() {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState<any>(null);

  const checkAccount = async () => {
    if (!email || !adminKey) {
      setError('Email and admin key are required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/unlock-account?email=${encodeURIComponent(email)}&key=${encodeURIComponent(adminKey)}`);
      const data = await response.json();

      if (response.ok) {
        setAccountStatus(data);
        if (data.isLocked) {
          setMessage(`Account is locked until ${new Date(data.lockedUntil).toLocaleString()}`);
        } else {
          setMessage('Account is not locked');
        }
      } else {
        setError(data.error || 'Failed to check account');
        setAccountStatus(null);
      }
    } catch (err) {
      setError('Failed to check account status');
      setAccountStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async () => {
    if (!email || !adminKey) {
      setError('Email and admin key are required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, adminKey })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setAccountStatus(null);
        // Check status again
        setTimeout(checkAccount, 1000);
      } else {
        setError(data.error || 'Failed to unlock account');
      }
    } catch (err) {
      setError('Failed to unlock account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-12">
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4">
        <div className="glass rounded-xl glow-blue border border-blue-400 p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm rounded-2xl mr-4">
              <Shield className="h-8 w-8 text-red-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Account Unlock Tool</h1>
              <p className="text-white/90">Administrative tool to unlock locked accounts</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-300 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 mb-1">Security Notice</p>
                <p className="text-amber-700">Accounts are automatically locked after 3 failed login attempts for 15 minutes. Use this tool to manually unlock accounts when needed.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fisherbackflows.com"
                className="w-full px-4 py-2 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Admin Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                className="w-full px-4 py-2 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            {accountStatus && (
              <div className={`rounded-2xl p-4 ${accountStatus.isLocked ? 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200' : 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200'}`}>
                <h3 className="font-semibold mb-2 flex items-center">
                  {accountStatus.isLocked ? (
                    <>
                      <Lock className="h-5 w-5 text-red-300 mr-2" />
                      <span className="text-red-900">Account Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-5 w-5 text-green-300 mr-2" />
                      <span className="text-green-900">Account Active</span>
                    </>
                  )}
                </h3>
                <div className="text-sm space-y-1">
                  <p className={accountStatus.isLocked ? 'text-red-700' : 'text-green-700'}>
                    Failed Attempts: {accountStatus.failedAttempts}/3
                  </p>
                  {accountStatus.lockedUntil && (
                    <p className="text-red-700">
                      Locked Until: {new Date(accountStatus.lockedUntil).toLocaleString()}
                    </p>
                  )}
                  {accountStatus.lastFailedLogin && (
                    <p className={accountStatus.isLocked ? 'text-red-700' : 'text-green-700'}>
                      Last Failed: {new Date(accountStatus.lastFailedLogin).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200 rounded-2xl p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-2xl p-4">
                <p className="text-green-700 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {message}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={checkAccount}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              <Button
                onClick={unlockAccount}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl hover:bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl text-white"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Account
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-blue-400">
            <h3 className="font-semibold text-white mb-2">Common Issues:</h3>
            <ul className="text-sm text-white/90 space-y-1">
              <li>• Account locks automatically after 3 failed attempts</li>
              <li>• Lock duration is 15 minutes by default</li>
              <li>• Rate limiting may also apply (5 attempts per 5 minutes)</li>
              <li>• Contact IT if account remains locked after unlock</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}