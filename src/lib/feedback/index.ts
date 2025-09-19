export type FeedbackType = 'service_quality' | 'technician_performance' | 'scheduling' | 'communication' | 'pricing' | 'overall_experience' | 'suggestion' | 'complaint';

export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export interface FeedbackCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: FeedbackQuestion[];
}

export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no' | 'scale';
  required: boolean;
  options?: string[];
  scale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
}

export interface FeedbackResponse {
  questionId: string;
  value: string | number | boolean;
  text?: string; // For additional comments
}

export interface CustomerFeedback {
  id: string;
  customerId: string;
  appointmentId?: string;
  technicianId?: string;
  type: FeedbackType;
  overallRating: FeedbackRating;
  responses: FeedbackResponse[];
  additionalComments?: string;
  isAnonymous: boolean;
  status: 'submitted' | 'reviewed' | 'addressed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  followUpRequired: boolean;
  metadata: {
    source: 'web' | 'mobile' | 'email' | 'phone' | 'in_person';
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  };
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Record<FeedbackRating, number>;
  feedbackByType: Record<FeedbackType, number>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trends: {
    period: string;
    rating: number;
    count: number;
  }[];
  topIssues: {
    category: string;
    count: number;
    avgRating: number;
  }[];
  technicianRatings: {
    technicianId: string;
    name: string;
    averageRating: number;
    totalFeedback: number;
  }[];
}

export const feedbackCategories: FeedbackCategory[] = [
  {
    id: 'service_quality',
    name: 'Service Quality',
    description: 'Rate the quality of service provided',
    icon: 'Star',
    color: 'blue',
    questions: [
      {
        id: 'service_rating',
        text: 'How would you rate the overall quality of service?',
        type: 'rating',
        required: true
      },
      {
        id: 'work_completed',
        text: 'Was the work completed to your satisfaction?',
        type: 'yes_no',
        required: true
      },
      {
        id: 'cleanliness',
        text: 'How clean did the technician leave your work area?',
        type: 'scale',
        required: false,
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Very messy',
          maxLabel: 'Spotless'
        }
      }
    ]
  },
  {
    id: 'technician_performance',
    name: 'Technician Performance',
    description: 'Evaluate your technician\'s performance',
    icon: 'User',
    color: 'green',
    questions: [
      {
        id: 'professionalism',
        text: 'How professional was your technician?',
        type: 'rating',
        required: true
      },
      {
        id: 'knowledge',
        text: 'How knowledgeable did the technician seem?',
        type: 'rating',
        required: true
      },
      {
        id: 'explanation',
        text: 'Did the technician explain the work clearly?',
        type: 'yes_no',
        required: false
      },
      {
        id: 'punctuality',
        text: 'Was the technician on time?',
        type: 'multiple_choice',
        required: false,
        options: ['Early', 'On time', 'Slightly late (< 15 min)', 'Late (15-30 min)', 'Very late (> 30 min)']
      }
    ]
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    description: 'Rate your scheduling experience',
    icon: 'Calendar',
    color: 'purple',
    questions: [
      {
        id: 'booking_ease',
        text: 'How easy was it to book your appointment?',
        type: 'rating',
        required: true
      },
      {
        id: 'appointment_availability',
        text: 'Were you able to get your preferred appointment time?',
        type: 'yes_no',
        required: false
      },
      {
        id: 'reminder_helpfulness',
        text: 'How helpful were our appointment reminders?',
        type: 'scale',
        required: false,
        scale: {
          min: 1,
          max: 5,
          minLabel: 'Not helpful',
          maxLabel: 'Very helpful'
        }
      }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Rate our communication with you',
    icon: 'MessageCircle',
    color: 'orange',
    questions: [
      {
        id: 'response_time',
        text: 'How quickly did we respond to your inquiries?',
        type: 'rating',
        required: true
      },
      {
        id: 'information_clarity',
        text: 'Was the information provided clear and helpful?',
        type: 'rating',
        required: true
      },
      {
        id: 'preferred_contact',
        text: 'What\'s your preferred method of communication?',
        type: 'multiple_choice',
        required: false,
        options: ['Phone call', 'Email', 'Text message', 'In-person', 'Mobile app notification']
      }
    ]
  },
  {
    id: 'pricing',
    name: 'Pricing',
    description: 'Rate our pricing and billing',
    icon: 'DollarSign',
    color: 'red',
    questions: [
      {
        id: 'value_for_money',
        text: 'How would you rate the value for money?',
        type: 'rating',
        required: true
      },
      {
        id: 'pricing_transparency',
        text: 'Were our prices clearly communicated upfront?',
        type: 'yes_no',
        required: true
      },
      {
        id: 'billing_accuracy',
        text: 'Was your bill accurate?',
        type: 'yes_no',
        required: false
      }
    ]
  },
  {
    id: 'overall_experience',
    name: 'Overall Experience',
    description: 'Rate your overall experience with us',
    icon: 'Heart',
    color: 'pink',
    questions: [
      {
        id: 'overall_satisfaction',
        text: 'How satisfied are you with your overall experience?',
        type: 'rating',
        required: true
      },
      {
        id: 'recommendation_likelihood',
        text: 'How likely are you to recommend us to others?',
        type: 'scale',
        required: true,
        scale: {
          min: 0,
          max: 10,
          minLabel: 'Not likely',
          maxLabel: 'Extremely likely'
        }
      },
      {
        id: 'return_customer',
        text: 'Would you use our services again?',
        type: 'yes_no',
        required: false
      }
    ]
  }
];

export function calculateOverallRating(responses: FeedbackResponse[]): FeedbackRating {
  const ratingResponses = responses.filter(r => typeof r.value === 'number' && r.value >= 1 && r.value <= 5);
  if (ratingResponses.length === 0) return 3;
  
  const sum = ratingResponses.reduce((acc, r) => acc + (r.value as number), 0);
  const average = sum / ratingResponses.length;
  
  return Math.round(Math.max(1, Math.min(5, average))) as FeedbackRating;
}

export function determineResourceWorthiness(feedback: CustomerFeedback): 'low' | 'medium' | 'high' | 'urgent' {
  const { overallRating, responses, type } = feedback;
  
  // Urgent priority for very low ratings or complaint types
  if (overallRating <= 2 || type === 'complaint') {
    return 'urgent';
  }
  
  // High priority for service quality or technician issues
  if ((type === 'service_quality' || type === 'technician_performance') && overallRating <= 3) {
    return 'high';
  }
  
  // Check for specific negative responses
  const hasNegativeResponses = responses.some(r => {
    if (typeof r.value === 'number' && r.value <= 2) return true;
    if (typeof r.value === 'boolean' && r.value === false) return true;
    return false;
  });
  
  if (hasNegativeResponses) {
    return overallRating <= 3 ? 'high' : 'medium';
  }
  
  return 'low';
}

export function extractTags(feedback: CustomerFeedback): string[] {
  const tags: Set<string> = new Set();
  
  // Add type-based tag
  tags.add(feedback.type.replace('_', ' '));
  
  // Add rating-based tags
  if (feedback.overallRating >= 4) {
    tags.add('positive');
  } else if (feedback.overallRating <= 2) {
    tags.add('negative');
  } else {
    tags.add('neutral');
  }
  
  // Add priority-based tags
  tags.add(`${feedback.priority} priority`);
  
  // Analyze responses for specific tags
  feedback.responses.forEach(response => {
    if (response.questionId.includes('professionalism') && typeof response.value === 'number' && response.value <= 2) {
      tags.add('unprofessional behavior');
    }
    if (response.questionId.includes('punctuality') && typeof response.value === 'string' && response.value.includes('late')) {
      tags.add('timeliness issue');
    }
    if (response.questionId.includes('cleanliness') && typeof response.value === 'number' && response.value <= 2) {
      tags.add('cleanliness issue');
    }
    if (response.questionId.includes('pricing') && typeof response.value === 'number' && response.value <= 2) {
      tags.add('pricing concern');
    }
  });
  
  // Add technician-specific tag if present
  if (feedback.technicianId) {
    tags.add('technician feedback');
  }
  
  return Array.from(tags);
}

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  if (!text) return 'neutral';
  
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'outstanding', 'professional', 'friendly', 'helpful', 'satisfied', 'recommend', 'love', 'best'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'disappointing', 'unprofessional', 'rude', 'late', 'dirty', 'expensive', 'worst', 'hate', 'never', 'dissatisfied'];
  
  const lowerText = text.toLowerCase();
  const positiveMatches = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeMatches = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveMatches > negativeMatches) return 'positive';
  if (negativeMatches > positiveMatches) return 'negative';
  return 'neutral';
}

export function generateFeedbackInsights(feedbackList: CustomerFeedback[]): FeedbackAnalytics {
  if (feedbackList.length === 0) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      feedbackByType: {} as Record<FeedbackType, number>,
      sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
      trends: [],
      topIssues: [],
      technicianRatings: []
    };
  }
  
  const totalFeedback = feedbackList.length;
  const totalRating = feedbackList.reduce((sum, f) => sum + f.overallRating, 0);
  const averageRating = totalRating / totalFeedback;
  
  // Rating distribution
  const ratingDistribution: Record<FeedbackRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackList.forEach(f => ratingDistribution[f.overallRating]++);
  
  // Feedback by type
  const feedbackByType: Record<FeedbackType, number> = {} as Record<FeedbackType, number>;
  feedbackList.forEach(f => {
    feedbackByType[f.type] = (feedbackByType[f.type] || 0) + 1;
  });
  
  // Sentiment analysis
  const sentimentAnalysis = { positive: 0, neutral: 0, negative: 0 };
  feedbackList.forEach(f => {
    const sentiment = f.additionalComments ? analyzeSentiment(f.additionalComments) : 
                     f.overallRating >= 4 ? 'positive' : f.overallRating <= 2 ? 'negative' : 'neutral';
    sentimentAnalysis[sentiment]++;
  });
  
  // Trends (simplified - last 7 days)
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayFeedback = feedbackList.filter(f => f.createdAt.startsWith(dateStr));
    const dayRating = dayFeedback.length > 0 ? 
      dayFeedback.reduce((sum, f) => sum + f.overallRating, 0) / dayFeedback.length : 0;
    
    trends.push({
      period: dateStr,
      rating: Math.round(dayRating * 10) / 10,
      count: dayFeedback.length
    });
  }
  
  // Top issues (categories with lowest average ratings)
  const issueMap = new Map<string, { count: number; totalRating: number }>();
  feedbackList.forEach(f => {
    if (!issueMap.has(f.type)) {
      issueMap.set(f.type, { count: 0, totalRating: 0 });
    }
    const issue = issueMap.get(f.type)!;
    issue.count++;
    issue.totalRating += f.overallRating;
  });
  
  const topIssues = Array.from(issueMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgRating: Math.round((data.totalRating / data.count) * 10) / 10
    }))
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 5);
  
  // Technician ratings
  const techMap = new Map<string, { count: number; totalRating: number }>();
  feedbackList.filter(f => f.technicianId).forEach(f => {
    if (!techMap.has(f.technicianId!)) {
      techMap.set(f.technicianId!, { count: 0, totalRating: 0 });
    }
    const tech = techMap.get(f.technicianId!)!;
    tech.count++;
    tech.totalRating += f.overallRating;
  });
  
  const technicianRatings = Array.from(techMap.entries())
    .map(([technicianId, data]) => ({
      technicianId,
      name: `Technician ${technicianId.slice(-4)}`, // Mock name
      averageRating: Math.round((data.totalRating / data.count) * 10) / 10,
      totalFeedback: data.count
    }))
    .sort((a, b) => b.averageRating - a.averageRating);
  
  return {
    totalFeedback,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    feedbackByType,
    sentimentAnalysis,
    trends,
    topIssues,
    technicianRatings
  };
}