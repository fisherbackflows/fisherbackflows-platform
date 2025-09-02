'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Search,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Video,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I add a new customer?',
      answer: 'Go to the Customers section and click "Add Customer". Fill in the required information including name, contact details, and device information.',
      category: 'customers'
    },
    {
      id: '2',
      question: 'How do I create a test report?',
      answer: 'From the main dashboard, click "New Test Report" or go to Test Report section. Select the customer, fill in test details, and save the report.',
      category: 'testing'
    },
    {
      id: '3',
      question: 'How do I schedule an appointment?',
      answer: 'Go to the Schedule section and click "New Appointment". Choose the customer, date, time, and service type. The appointment will be added to your calendar.',
      category: 'scheduling'
    },
    {
      id: '4',
      question: 'How do I generate an invoice?',
      answer: 'Navigate to Invoices and click "New Invoice". Select the customer, add line items for services performed, and the system will calculate taxes and totals automatically.',
      category: 'invoicing'
    },
    {
      id: '5',
      question: 'How do I export my data?',
      answer: 'Go to More > Export Data. Choose what type of data you want to export (customers, test reports, invoices) and select the format. The file will be downloaded to your device.',
      category: 'data'
    },
    {
      id: '6',
      question: 'How do I backup my business data?',
      answer: 'Navigate to More > Backup & Restore. Click "Create Backup Now" to manually create a backup, or view your automatic backup schedule.',
      category: 'data'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'customers', name: 'Customer Management' },
    { id: 'testing', name: 'Test Reports' },
    { id: 'scheduling', name: 'Scheduling' },
    { id: 'invoicing', name: 'Invoicing' },
    { id: 'data', name: 'Data Management' }
  ];

  const filteredFAQs = faqItems.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/team-portal/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      {/* Header */}
      <div className="glass glow-blue-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/app/more">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white/80">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/80" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-blue-500/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Popular Help Topics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="#faq-1" className="flex items-center p-4 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors">
                  <Book className="h-5 w-5 text-blue-300 mr-3" />
                  <div>
                    <h3 className="font-medium text-white/80">Getting Started Guide</h3>
                    <p className="text-sm text-white/80">Learn the basics of the system</p>
                  </div>
                </Link>
                
                <Link href="#faq-2" className="flex items-center p-4 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors">
                  <Video className="h-5 w-5 text-purple-300 mr-3" />
                  <div>
                    <h3 className="font-medium text-white/80">Video Tutorials</h3>
                    <p className="text-sm text-white/80">Watch step-by-step tutorials</p>
                  </div>
                </Link>
                
                <Link href="#faq-3" className="flex items-center p-4 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors">
                  <FileText className="h-5 w-5 text-green-300 mr-3" />
                  <div>
                    <h3 className="font-medium text-white/80">User Manual</h3>
                    <p className="text-sm text-white/80">Download the complete guide</p>
                  </div>
                </Link>
                
                <Link href="#contact" className="flex items-center p-4 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors">
                  <MessageCircle className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-white/80">Contact Support</h3>
                    <p className="text-sm text-white/80">Get help from our team</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Category Filter */}
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                  <HelpCircle className="h-5 w-5 inline mr-2" />
                  Frequently Asked Questions
                </h2>
                
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-white/80 mx-auto mb-4" />
                    <p className="text-white/80">No help articles found for your search.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="border border-blue-500/50 rounded-2xl">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:glass transition-colors"
                        >
                          <h3 className="font-medium text-white/80">{faq.question}</h3>
                          {expandedFAQ === faq.id ? (
                            <ChevronDown className="h-5 w-5 text-white/80" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-white/80" />
                          )}
                        </button>
                        
                        {expandedFAQ === faq.id && (
                          <div className="px-4 pb-4 border-t border-blue-500/50">
                            <p className="text-white/80 pt-3">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl glow-blue-sm p-6 sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold text-white/80 mb-4">Contact Support</h3>
                
                <div className="space-y-4">
                  <a
                    href="tel:2532788692"
                    className="flex items-center p-3 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-green-300 mr-3" />
                    <div>
                      <div className="font-medium text-white/80">Phone</div>
                      <div className="text-sm text-white/80">(253) 278-8692</div>
                    </div>
                  </a>
                  
                  <a
                    href="mailto:support@fisherbackflows.com"
                    className="flex items-center p-3 border border-blue-500/50 rounded-2xl hover:border-blue-300 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-blue-300 mr-3" />
                    <div>
                      <div className="font-medium text-white/80">Email</div>
                      <div className="text-sm text-white/80">support@fisherbackflows.com</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-white/80 mb-4">Quick Links</h3>
                
                <div className="space-y-2">
                  <a href="#" className="flex items-center text-sm text-blue-300 hover:text-blue-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    System Status
                  </a>
                  <a href="#" className="flex items-center text-sm text-blue-300 hover:text-blue-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Feature Requests
                  </a>
                  <a href="#" className="flex items-center text-sm text-blue-300 hover:text-blue-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Report a Bug
                  </a>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                  <div className="flex items-start">
                    <MessageCircle className="h-5 w-5 text-blue-300 mr-3 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">Need Help?</p>
                      <p className="text-blue-700">
                        Our support team is available Monday-Friday, 8 AM - 5 PM PST.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}