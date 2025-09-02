'use client';

import { useState, useEffect } from 'react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
        <div className="text-white">Loading feedback data...</div>
      </div>
    );
  }

  return <FeedbackDashboard feedbackData={feedbackData} />;
}