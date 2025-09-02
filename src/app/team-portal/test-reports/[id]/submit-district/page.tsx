'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, CheckCircle, AlertCircle, ArrowLeft, Building2, Clock, Mail } from 'lucide-react';

interface WaterDistrict {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  submission_requirements: string;
  submission_format: string;
  submission_method: string;
}

interface Submission {
  id: string;
  submission_status: 'pending' | 'submitted' | 'failed';
  submitted_at?: string;
  water_district: {
    name: string;
    contact_email: string;
  };
  submission_method: string;
}

export default function SubmitDistrictPage() {
  const params = useParams();
  const router = useRouter();
  const testReportId = params.id as string;
  
  const [districts, setDistricts] = useState<WaterDistrict[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [submissionMethod, setSubmissionMethod] = useState<'email' | 'api' | 'portal'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [testReportId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load water districts and submission status in parallel
      const [districtsResponse, submissionsResponse] = await Promise.all([
        fetch('/api/water-districts'),
        fetch(`/api/test-reports/submit-district?testReportId=${testReportId}`)
      ]);

      if (districtsResponse.ok) {
        const districtsData = await districtsResponse.json();
        setDistricts(districtsData.districts || []);
      }

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load district information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDistrictId) {
      setError('Please select a water district');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/test-reports/submit-district', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testReportId,
          waterDistrictId: selectedDistrictId,
          submissionMethod
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message);
        // Refresh submissions to show updated status
        await loadData();
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Network error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-green-400 border-green-400';
      case 'pending':
        return 'text-yellow-400 border-yellow-400';
      case 'failed':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-blue-400 glow-blue-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading district information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="glass rounded-xl p-3 border border-blue-400 hover:border-blue-300 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 text-blue-300 group-hover:text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Submit to Water District</h1>
            <p className="text-gray-400">Test Report #{testReportId.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="glass rounded-xl p-4 border border-red-400 glow-red-sm mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="glass rounded-xl p-4 border border-green-400 glow-green-sm mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          </div>
        )}

        {/* Current Submissions Status */}
        {submissions.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-blue-400 glow-blue-sm mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-blue-400" />
              Previous Submissions
            </h2>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`glass rounded-xl p-4 border ${getStatusColor(submission.submission_status)} glow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(submission.submission_status)}
                      <div>
                        <p className="text-white font-medium">{submission.water_district.name}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {submission.water_district.contact_email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`capitalize font-medium ${getStatusColor(submission.submission_status).split(' ')[0]}`}>
                        {submission.submission_status}
                      </p>
                      {submission.submitted_at && (
                        <p className="text-gray-400 text-sm">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Form */}
        <div className="glass rounded-2xl p-6 border border-blue-400 glow-blue-sm">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <Send className="h-6 w-6 text-blue-400" />
            Submit to New District
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Water District Selection */}
            <div>
              <label className="block text-white font-medium mb-3">
                Select Water District *
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full glass rounded-xl p-4 border border-blue-400 text-white bg-black/20 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20"
                required
              >
                <option value="">Choose a district...</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id} className="bg-gray-900">
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Show district details when selected */}
            {selectedDistrictId && (
              <div className="glass rounded-xl p-4 border border-gray-600">
                {(() => {
                  const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
                  return selectedDistrict && (
                    <div>
                      <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-400" />
                        {selectedDistrict.name}
                      </h3>
                      <p className="text-gray-300 text-sm mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedDistrict.contact_email}
                      </p>
                      <p className="text-gray-400 text-sm">
                        <strong>Requirements:</strong> {selectedDistrict.submission_requirements}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Submission Method */}
            <div>
              <label className="block text-white font-medium mb-3">
                Submission Method
              </label>
              <div className="flex gap-4">
                {['email', 'api', 'portal'].map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="submissionMethod"
                      value={method}
                      checked={submissionMethod === method}
                      onChange={(e) => setSubmissionMethod(e.target.value as any)}
                      className="text-blue-400 focus:ring-blue-400"
                    />
                    <span className="text-gray-300 capitalize">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !selectedDistrictId}
                className="flex-1 glass rounded-xl py-4 px-6 border border-blue-400 text-white font-semibold hover:border-blue-300 hover:bg-blue-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}