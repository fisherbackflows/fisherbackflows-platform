'use client';

import { useEffect, useState } from 'react';
import IdleLogoutTimer from '@/components/auth/IdleLogoutTimer';

interface TeamPortalLayoutProps {
  children: React.ReactNode;
}

export default function TeamPortalLayout({ children }: TeamPortalLayoutProps) {
  const [userSettings, setUserSettings] = useState({
    autoLogout: 60, // Default 60 minutes
    idleLogoutEnabled: true
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated (skip for login and public pages)
    const checkAuth = async () => {
      const currentPath = window.location.pathname;
      const publicPaths = ['/team-portal/login', '/team-portal/register-company', '/team-portal/dashboard'];

      // For public pages, just set loading to false
      if (publicPaths.some(path => currentPath.startsWith(path))) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/team/auth/me');
        const isAuth = response.ok;
        setIsAuthenticated(isAuth);

        // If authenticated, load user settings
        if (isAuth) {
          loadUserSettings();
        } else {
          // Redirect to login for protected pages
          window.location.href = '/team-portal/login';
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        // Redirect to login on auth failure for protected pages
        window.location.href = '/team-portal/login';
        return;
      } finally {
        setLoading(false);
      }
    };

    const loadUserSettings = () => {
      try {
        const savedSettings = localStorage.getItem('team_portal_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setUserSettings({
            autoLogout: parsed.autoLogout || 60,
            idleLogoutEnabled: true // Always enable idle logout for security
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Use default settings
        setUserSettings({
          autoLogout: 60,
          idleLogoutEnabled: true
        });
      }
    };

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail) {
        setUserSettings({
          autoLogout: event.detail.autoLogout || 60,
          idleLogoutEnabled: true
        });
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);

    checkAuth();

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Idle Logout Timer - only show for authenticated users on non-login pages */}
      {isAuthenticated && userSettings.idleLogoutEnabled && !window.location.pathname.includes('/login') && (
        <IdleLogoutTimer
          timeoutMinutes={userSettings.autoLogout}
          warningMinutes={5}
          enabled={true}
        />
      )}
    </>
  );
}