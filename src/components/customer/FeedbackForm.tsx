'use client';

import React, { useState, useCallback } from 'react';
import {
  Star,
  Send,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Heart,
  ThumbsUp,
  Calendar,
  DollarSign,
  User,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FeedbackCategory,
  FeedbackQuestion,
  FeedbackResponse,
  CustomerFeedback,
  FeedbackRating,
  feedbackCategories,
  calculateOverallRating,
  determineResourceWorthiness,
  extractTags
} from '@/lib/feedback';

interface FeedbackFormProps {
  appointmentId?: string;
  technicianId?: string;
  customerId: string;
  onSubmit: (feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  User,
  Calendar,
  MessageCircle,
  DollarSign,
  Heart
};

export default function FeedbackForm({
  appointmentId,
  technicianId,
  customerId,
  onSubmit,
  onClose
}: FeedbackFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [responses, setResponses] = useState<Record<string, FeedbackResponse>>({});
  const [additionalComments, setAdditionalComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCategorySelect = useCallback((category: FeedbackCategory) => {
    setSelectedCategory(category);
    setCurrentStep(1);
  }, []);

  const handleResponseChange = useCallback((questionId: string, value: any, text?: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { questionId, value, text }
    }));
  }, []);

  const renderRatingInput = useCallback((question: FeedbackQuestion, currentValue?: number) => {
    return (
      <div className="flex items-center space-x-2 justify-center">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => handleResponseChange(question.id, rating)}
            className={`p-2 transition-all duration-200 ${
              currentValue === rating
                ? 'text-yellow-400 transform scale-110'
                : 'text-white/30 hover:text-yellow-300 hover:scale-105'
            }`}
          >
            <Star className={`h-8 w-8 ${currentValue === rating ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  }, [handleResponseChange]);

  const renderScaleInput = useCallback((question: FeedbackQuestion, currentValue?: number) => {
    if (!question.scale) return null;

    const { min, max, minLabel, maxLabel } = question.scale;
    const range = max - min + 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          {Array.from({ length: range }, (_, i) => {
            const value = min + i;
            return (
              <button
                key={value}
                onClick={() => handleResponseChange(question.id, value)}
                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  currentValue === value
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-white/20 text-white/60 hover:border-blue-400 hover:text-blue-400'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
        {currentValue !== undefined && (
          <div className="text-center text-blue-400 font-medium">
            Selected: {currentValue}
          </div>
        )}
      </div>
    );
  }, [handleResponseChange]);

  const renderYesNoInput = useCallback((question: FeedbackQuestion, currentValue?: boolean) => {
    return (
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => handleResponseChange(question.id, true)}
          className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
            currentValue === true
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-white/20 text-white/60 hover:border-green-400 hover:text-green-400'
          }`}
        >
          <CheckCircle className="h-5 w-5 mr-2 inline" />
          Yes
        </button>
        <button
          onClick={() => handleResponseChange(question.id, false)}
          className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
            currentValue === false
              ? 'bg-red-500 border-red-500 text-white'
              : 'border-white/20 text-white/60 hover:border-red-400 hover:text-red-400'
          }`}
        >
          <AlertCircle className="h-5 w-5 mr-2 inline" />
          No
        </button>
      </div>
    );
  }, [handleResponseChange]);

  const renderMultipleChoiceInput = useCallback((question: FeedbackQuestion, currentValue?: string) => {
    if (!question.options) return null;

    return (
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleResponseChange(question.id, option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
              currentValue === option
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'border-white/20 text-white/80 hover:border-blue-400 hover:bg-blue-500/10'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }, [handleResponseChange]);

  const renderQuestion = useCallback((question: FeedbackQuestion, index: number) => {
    const response = responses[question.id];
    const currentValue = response?.value;

    return (
      <div key={question.id} className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Question {index + 1} of {selectedCategory?.questions.length}
          </h3>
          <p className="text-lg text-white/80">{question.text}</p>
          {question.required && (
            <p className="text-sm text-blue-400 mt-2">* Required</p>
          )}
        </div>

        <div className="max-w-md mx-auto">
          {question.type === 'rating' && renderRatingInput(question, currentValue as number)}
          {question.type === 'scale' && renderScaleInput(question, currentValue as number)}
          {question.type === 'yes_no' && renderYesNoInput(question, currentValue as boolean)}
          {question.type === 'multiple_choice' && renderMultipleChoiceInput(question, currentValue as string)}
          {question.type === 'text' && (
            <textarea
              value={(currentValue as string) || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="Please share your thoughts..."
              className="w-full h-32 p-4 glass rounded-lg border border-white/20 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    );
  }, [responses, selectedCategory, renderRatingInput, renderScaleInput, renderYesNoInput, renderMultipleChoiceInput, handleResponseChange]);

  const handleNext = useCallback(() => {
    if (!selectedCategory) return;

    const currentQuestion = selectedCategory.questions[currentStep - 1];
    if (currentQuestion?.required && !responses[currentQuestion.id]) {
      return; // Don't proceed if required question isn't answered
    }

    if (currentStep < selectedCategory.questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(selectedCategory.questions.length + 1); // Move to comments step
    }
  }, [currentStep, selectedCategory, responses]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setSelectedCategory(null);
      setCurrentStep(0);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const responseArray = Object.values(responses);
      const overallRating = calculateOverallRating(responseArray);
      
      const feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt' | 'updatedAt'> = {
        customerId,
        appointmentId,
        technicianId,
        type: selectedCategory.id as any,
        overallRating,
        responses: responseArray,
        additionalComments: additionalComments.trim() || undefined,
        isAnonymous,
        status: 'submitted',
        priority: determineResourceWorthiness({
          overallRating,
          responses: responseArray,
          type: selectedCategory.id as any
        } as CustomerFeedback),
        tags: extractTags({
          overallRating,
          responses: responseArray,
          type: selectedCategory.id as any,
          priority: 'medium'
        } as CustomerFeedback),
        followUpRequired: overallRating <= 3,
        metadata: {
          source: 'web',
          userAgent: navigator.userAgent
        }
      };

      await onSubmit(feedbackData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategory, responses, additionalComments, isAnonymous, customerId, appointmentId, technicianId, onSubmit]);

  const isCurrentQuestionAnswered = useCallback(() => {
    if (!selectedCategory || currentStep === 0) return true;
    if (currentStep > selectedCategory.questions.length) return true;
    
    const question = selectedCategory.questions[currentStep - 1];
    if (!question.required) return true;
    
    return !!responses[question.id];
  }, [selectedCategory, currentStep, responses]);

  if (isSubmitted) {
    return (
      <div className="glass rounded-2xl p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ThumbsUp className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
        <p className="text-white/80 mb-6">
          Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our services.
        </p>
        {onClose && (
          <Button onClick={onClose} className="btn-primary px-6 py-2 rounded-lg">
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Share Your Feedback</h1>
        <p className="text-white/60">Help us improve our services by sharing your experience</p>
      </div>

      {/* Progress Bar */}
      {selectedCategory && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Progress</span>
            <span>{currentStep} of {selectedCategory.questions.length + 1}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (selectedCategory.questions.length + 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Selection */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white text-center">
            What would you like to provide feedback about?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {feedbackCategories.map((category) => {
              const IconComponent = iconMap[category.icon] || Star;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="p-6 glass-darker rounded-xl text-left hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 bg-${category.color}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className={`h-6 w-6 text-${category.color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/60 text-sm">{category.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Questions */}
      {selectedCategory && currentStep > 0 && currentStep <= selectedCategory.questions.length && (
        <div className="space-y-8">
          {renderQuestion(selectedCategory.questions[currentStep - 1], currentStep - 1)}
        </div>
      )}

      {/* Additional Comments */}
      {selectedCategory && currentStep === selectedCategory.questions.length + 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Additional Comments</h3>
            <p className="text-white/80">Is there anything else you'd like to share? (Optional)</p>
          </div>
          
          <textarea
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            placeholder="Share any additional thoughts, suggestions, or concerns..."
            className="w-full h-32 p-4 glass rounded-lg border border-white/20 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center justify-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-white/80 text-sm">
              Submit anonymously
            </label>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {currentStep > 0 && (
          <Button
            onClick={handlePrevious}
            className="btn-glass px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <div className="flex-1" />

        {selectedCategory && currentStep === selectedCategory.questions.length + 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        ) : currentStep > 0 && (
          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered()}
            className="btn-primary px-4 py-2 rounded-lg"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {onClose && currentStep === 0 && (
          <Button onClick={onClose} className="btn-glass px-4 py-2 rounded-lg">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}