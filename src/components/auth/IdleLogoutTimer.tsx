'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';

interface IdleLogoutTimerProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

export default function IdleLogoutTimer({
  timeoutMinutes = 60, // Default: 1 hour
  warningMinutes = 5,   // Show warning 5 minutes before logout
  enabled = true
}: IdleLogoutTimerProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningMinutes * 60);

  const performLogout = useCallback(async () => {
    try {
      // Call logout API
      await fetch('/api/team/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Redirect to login page regardless of API success
      router.push('/team-portal/login?reason=idle');
    }
  }, [router]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    setCountdown(warningMinutes * 60);
    reset();
  }, [warningMinutes]);

  // Handle when user becomes idle (show warning)
  const handleIdle = useCallback(() => {
    if (enabled) {
      setShowWarning(true);
      setCountdown(warningMinutes * 60);
    }
  }, [enabled, warningMinutes]);

  // Handle when user becomes active again (hide warning)
  const handleActive = useCallback(() => {
    setShowWarning(false);
    setCountdown(warningMinutes * 60);
  }, [warningMinutes]);

  const { reset } = useIdleTimer({
    timeout: (timeoutMinutes - warningMinutes) * 60 * 1000, // Show warning X minutes before timeout
    onIdle: handleIdle,
    onActive: handleActive,
    startOnLoad: enabled,
  });

  // Countdown timer for the warning modal
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showWarning && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            performLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showWarning, countdown, performLogout]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!enabled || !showWarning) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="glass rounded-2xl border border-amber-400 glow-amber p-8 max-w-md w-full mx-auto">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-amber-300" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-4">
              Session Timeout Warning
            </h2>

            {/* Message */}
            <p className="text-white/90 mb-6 leading-relaxed">
              You've been inactive for a while. Your session will automatically
              log out for security purposes.
            </p>

            {/* Countdown */}
            <div className="flex items-center justify-center space-x-2 mb-8 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <Clock className="h-5 w-5 text-amber-300" />
              <span className="text-xl font-bold text-amber-300">
                {formatTime(countdown)}
              </span>
              <span className="text-white/80">remaining</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={extendSession}
                className="flex-1 glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-xl font-medium"
              >
                Stay Logged In
              </Button>

              <Button
                onClick={performLogout}
                className="flex-1 glass border border-red-400 text-red-300 hover:bg-red-500/20 px-6 py-3 rounded-xl font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out Now
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-white/60 mt-4">
              Click anywhere or move your mouse to stay active
            </p>
          </div>
        </div>
      </div>
    </>
  );
}