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
        <div className="text-white">Loading feedback data...</div>
      </div>
    );
  }

  return <FeedbackDashboard feedbackData={feedbackData} />;
}