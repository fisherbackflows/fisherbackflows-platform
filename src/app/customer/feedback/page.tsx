'use client';

import { useState } from 'react';
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
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
      <PortalNavigation userInfo={{ name: 'Customer', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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