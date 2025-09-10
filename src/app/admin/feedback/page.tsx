'use client';

import { useState, useEffect } from 'react';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';
import FeedbackDashboard from '@/components/admin/FeedbackDashboard';
import { CustomerFeedback } from '@/lib/feedback';

export default function AdminFeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/admin/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedbackData(data.feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white">Loading feedback data...</div>
        </div>
      ) : (
        <FeedbackDashboard feedbackData={feedbackData} />
      )}
    </div>
  );
}