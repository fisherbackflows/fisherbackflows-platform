'use client';

import { useState } from 'react';
import FeedbackForm from '@/components/customer/FeedbackForm';
import { CustomerFeedback } from '@/lib/feedback';

export default function FeedbackPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFeedbackSubmit = async (feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/customer/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-purple-500/5" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <FeedbackForm
          customerId="customer-123" // This would come from auth context
          appointmentId={undefined} // Optional - can be passed via URL params
          technicianId={undefined}  // Optional - can be passed via URL params
          onSubmit={handleFeedbackSubmit}
        />
      </div>
    </div>
  );
}