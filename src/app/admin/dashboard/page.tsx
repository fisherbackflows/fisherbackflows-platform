'use client';

import { useState, useEffect } from 'react';
import AdminProtection from '@/components/auth/AdminProtection';
import { Calendar, Users, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';

interface AdminData {
  customers: number;
  appointments: number;
  revenue: number;
  recentAppointments: {
    id: string;
    customer_name: string;
    scheduled_date: string;
    status: string;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/simple-metrics');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <AdminProtection requiredRole="admin">
      <div className="min-h-screen bg-black">
        <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

          {/* Simple Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass border border-blue-400 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{data?.customers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-300" />
              </div>
            </div>

            <div className="glass border border-green-400 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm">Total Appointments</p>
                  <p className="text-2xl font-bold text-white">{data?.appointments || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-300" />
              </div>
            </div>

            <div className="glass border border-yellow-400 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm">Revenue (YTD)</p>
                  <p className="text-2xl font-bold text-white">${data?.revenue || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="glass border border-blue-400 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Appointments</h2>
            {data?.recentAppointments?.length ? (
              <div className="space-y-3">
                {data.recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 glass rounded-lg">
                    <div>
                      <p className="text-white font-medium">{appointment.customer_name}</p>
                      <p className="text-white/90 text-sm">{appointment.scheduled_date}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      appointment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/90">No recent appointments</p>
            )}
          </div>
        </main>
      </div>
    </AdminProtection>
  );
}