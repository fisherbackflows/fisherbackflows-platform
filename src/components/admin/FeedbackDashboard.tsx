'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MessageCircle,
  Users,
  Filter,
  Download,
  Search,
  Calendar,
  BarChart3,
  PieChart,
  Eye,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CustomerFeedback,
  FeedbackAnalytics,
  FeedbackType,
  FeedbackRating,
  generateFeedbackInsights
} from '@/lib/feedback';

interface FeedbackDashboardProps {
  feedbackData: CustomerFeedback[];
}

export default function FeedbackDashboard({ feedbackData }: FeedbackDashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | FeedbackType>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | FeedbackRating>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'addressed' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);

  const filteredFeedback = useMemo(() => {
    return feedbackData.filter(feedback => {
      const matchesType = selectedFilter === 'all' || feedback.type === selectedFilter;
      const matchesRating = ratingFilter === 'all' || feedback.overallRating === ratingFilter;
      const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        feedback.additionalComments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesType && matchesRating && matchesStatus && matchesSearch;
    });
  }, [feedbackData, selectedFilter, ratingFilter, statusFilter, searchTerm]);

  const analytics: FeedbackAnalytics = useMemo(() => {
    return generateFeedbackInsights(filteredFeedback);
  }, [filteredFeedback]);

  const exportFeedback = () => {
    const csvContent = [
      // Header
      ['Date', 'Type', 'Rating', 'Status', 'Priority', 'Customer', 'Technician', 'Comments', 'Tags'].join(','),
      // Data
      ...filteredFeedback.map(feedback => [
        new Date(feedback.createdAt).toLocaleDateString(),
        feedback.type,
        feedback.overallRating,
        feedback.status,
        feedback.priority,
        feedback.customerId,
        feedback.technicianId || '',
        `"${feedback.additionalComments || ''}"`,
        `"${feedback.tags.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-700/20';
      case 'low': return 'text-gray-800 bg-gray-500/20';
      default: return 'text-gray-800 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-400 bg-blue-700/20';
      case 'reviewed': return 'text-yellow-400 bg-yellow-500/20';
      case 'addressed': return 'text-green-400 bg-green-700/20';
      case 'closed': return 'text-gray-800 bg-gray-500/20';
      default: return 'text-gray-800 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Customer Feedback Dashboard</h1>
            <p className="text-white/60 mt-2">
              Monitor customer satisfaction and service quality insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={exportFeedback}
              className="btn-glass px-4 py-2 rounded-lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-700/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalFeedback}</div>
            <div className="text-white/60 text-sm">Total Feedback</div>
          </div>

          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.averageRating.toFixed(1)}</div>
            <div className="text-white/60 text-sm">Average Rating</div>
          </div>

          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-green-700/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.sentimentAnalysis.positive}</div>
            <div className="text-white/60 text-sm">Positive Reviews</div>
          </div>

          <div className="glass rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {filteredFeedback.filter(f => f.priority === 'urgent' || f.priority === 'high').length}
            </div>
            <div className="text-white/60 text-sm">High Priority Issues</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Filters and Feedback List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Feedback Type</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as any)}
                    className="input-glass"
                  >
                    <option value="all">All Types</option>
                    <option value="service_quality">Service Quality</option>
                    <option value="technician_performance">Technician Performance</option>
                    <option value="scheduling">Scheduling</option>
                    <option value="communication">Communication</option>
                    <option value="pricing">Pricing</option>
                    <option value="overall_experience">Overall Experience</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value as any)}
                    className="input-glass"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="input-glass"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="addressed">Addressed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search comments or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-glass pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback List */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Feedback ({filteredFeedback.length})</h2>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredFeedback.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback matches your filters</p>
                  </div>
                ) : (
                  filteredFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      onClick={() => setSelectedFeedback(feedback)}
                      className="p-4 glass-darker rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.overallRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-white/60 text-sm">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(feedback.priority)}`}>
                            {feedback.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(feedback.status)}`}>
                            {feedback.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h3 className="text-white font-medium capitalize mb-1">
                          {feedback.type.replace('_', ' ')}
                        </h3>
                        {feedback.additionalComments && (
                          <p className="text-white/80 text-sm line-clamp-2">
                            {feedback.additionalComments}
                          </p>
                        )}
                      </div>

                      {feedback.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {feedback.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                          {feedback.tags.length > 3 && (
                            <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
                              +{feedback.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Rating Distribution */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-white/80 text-sm">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: analytics.totalFeedback > 0 
                            ? `${(analytics.ratingDistribution[rating as FeedbackRating] / analytics.totalFeedback) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <span className="text-white/60 text-sm w-8">
                      {analytics.ratingDistribution[rating as FeedbackRating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Sentiment Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Positive</span>
                  <span className="text-white">{analytics.sentimentAnalysis.positive}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Neutral</span>
                  <span className="text-white">{analytics.sentimentAnalysis.neutral}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Negative</span>
                  <span className="text-white">{analytics.sentimentAnalysis.negative}</span>
                </div>
              </div>
            </div>

            {/* Top Issues */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Areas for Improvement</h3>
              <div className="space-y-3">
                {analytics.topIssues.slice(0, 5).map((issue) => (
                  <div key={issue.category} className="p-3 glass-darker rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm capitalize">
                        {issue.category.replace('_', ' ')}
                      </span>
                      <span className={`text-sm ${getRatingColor(issue.avgRating)}`}>
                        {issue.avgRating}★
                      </span>
                    </div>
                    <div className="text-white/60 text-xs">
                      {issue.count} feedback{issue.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Ratings */}
            {analytics.technicianRatings.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Technician Performance</h3>
                <div className="space-y-3">
                  {analytics.technicianRatings.slice(0, 5).map((tech) => (
                    <div key={tech.technicianId} className="p-3 glass-darker rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/80 text-sm">{tech.name}</span>
                        <span className={`text-sm ${getRatingColor(tech.averageRating)}`}>
                          {tech.averageRating}★
                        </span>
                      </div>
                      <div className="text-white/60 text-xs">
                        {tech.totalFeedback} review{tech.totalFeedback !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Detail Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Feedback Details</h2>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating and Basic Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= selectedFeedback.overallRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                    <span className="text-white ml-3 text-lg font-bold">
                      {selectedFeedback.overallRating}/5
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white/60 text-sm">
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedFeedback.priority)}`}>
                        {selectedFeedback.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedFeedback.status)}`}>
                        {selectedFeedback.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <h3 className="text-white/80 text-sm mb-1">Category</h3>
                  <p className="text-white capitalize">
                    {selectedFeedback.type.replace('_', ' ')}
                  </p>
                </div>

                {/* Comments */}
                {selectedFeedback.additionalComments && (
                  <div>
                    <h3 className="text-white/80 text-sm mb-2">Additional Comments</h3>
                    <p className="text-white/90 p-4 glass-darker rounded-lg">
                      {selectedFeedback.additionalComments}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedFeedback.tags.length > 0 && (
                  <div>
                    <h3 className="text-white/80 text-sm mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeedback.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-700/20 text-blue-400 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Responses */}
                {selectedFeedback.responses.length > 0 && (
                  <div>
                    <h3 className="text-white/80 text-sm mb-2">Detailed Responses</h3>
                    <div className="space-y-3">
                      {selectedFeedback.responses.map((response, index) => (
                        <div key={response.questionId} className="p-3 glass-darker rounded-lg">
                          <div className="text-white/60 text-xs mb-1">
                            Question {index + 1}
                          </div>
                          <div className="text-white">
                            {typeof response.value === 'number' && response.value >= 1 && response.value <= 5
                              ? `${response.value}/5 stars`
                              : typeof response.value === 'boolean'
                              ? response.value ? 'Yes' : 'No'
                              : response.value}
                          </div>
                          {response.text && (
                            <div className="text-white/80 text-sm mt-1">{response.text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}