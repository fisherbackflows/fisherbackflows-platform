import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@/lib/supabase/server';
import { GPT5Service } from '@/lib/ai/gpt5-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { message, context, customerId } = await request.json();

    // Verify authentication - either customer or team member
    const { data: { session } } = await supabase.auth.getSession();
    
    // For customers, verify they own the conversation
    let isAuthorized = false;
    if (session) {
      // Check if team member (admin access)
      const { data: teamUser } = await supabase
        .from('team_users')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (teamUser) {
        isAuthorized = true;
      } else if (customerId) {
        // Check if customer owns the conversation
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('id', customerId)
          .eq('user_id', session.user.id)
          .single();
        
        isAuthorized = !!customer;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    const gpt5Service = new GPT5Service();

    // Determine response type based on message content
    let responseType = 'general';
    if (message.toLowerCase().includes('report') || message.toLowerCase().includes('results')) {
      responseType = 'report';
    } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('appointment')) {
      responseType = 'scheduling';
    } else if (message.toLowerCase().includes('compliance') || message.toLowerCase().includes('regulation')) {
      responseType = 'compliance';
    } else if (message.toLowerCase().includes('billing') || message.toLowerCase().includes('payment')) {
      responseType = 'billing';
    }

    // Generate intelligent response using GPT-5
    const chatResponse = await generateChatResponse(gpt5Service, message, responseType, customerId, context);

    // Log the chat interaction
    await (supabase as any).from('audit_logs').insert({
      table_name: 'ai_chat',
      action: 'CHAT_INTERACTION',
      details: {
        customerId,
        messageLength: message.length,
        responseType,
        context,
        userId: session?.user.id
      },
      created_by: session?.user.id || 'anonymous'
    });

    // Store chat history for context (optional)
    if (customerId) {
      await supabase.from('chat_history').insert({
        customer_id: customerId,
        message,
        response: chatResponse.message,
        response_type: responseType,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

async function generateChatResponse(
  gpt5Service: GPT5Service,
  message: string,
  responseType: string,
  customerId?: string,
  context?: any
) {
  // Try to use GPT-5 service first, fall back to structured responses
  try {
    // If we have a customer ID, get their real data for context
    let customerContext = '';
    if (customerId && gpt5Service) {
      try {
        const sanitizedData = await gpt5Service['getSanitizedCustomerData'](customerId);
        customerContext = `Customer Context: ${sanitizedData.customerType} customer with ${sanitizedData.deviceCount} devices, ${sanitizedData.serviceHistory} months history, compliance score ${sanitizedData.complianceScore}/100, risk level ${sanitizedData.riskLevel}.`;
      } catch (error) {
        console.log('Could not get customer context:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const systemPrompt = `You are a helpful customer service assistant for Fisher Backflows, a professional backflow testing company in Washington State.

    You help customers with:
    - Scheduling backflow testing appointments
    - Understanding test results and compliance requirements
    - Answering questions about backflow prevention devices
    - Explaining Washington State backflow regulations
    - Providing general information about services and pricing

    Guidelines:
    - Be professional, helpful, and knowledgeable
    - Focus on backflow testing and compliance
    - If you don't know something specific, direct them to contact support
    - Keep responses concise but informative
    - Always emphasize safety and regulatory compliance
    - Use customer context when available to personalize responses
    
    ${customerContext}
    Response type context: ${responseType}`;

    // Try to use actual AI service
    if (gpt5Service && typeof gpt5Service.generateBusinessInsights === 'function') {
      const aiResponse = await gpt5Service.generateBusinessInsights({
        query: `Customer support query: "${message}"`,
        context: 'customer_service',
        timeframe: '30d'
      });

      // Transform business insight into customer-friendly response
      const customerResponse = transformInsightToCustomerResponse(message, responseType, aiResponse);
      
      return {
        message: customerResponse.message,
        suggestions: customerResponse.suggestions,
        responseType,
        timestamp: new Date().toISOString(),
        canSchedule: responseType === 'scheduling',
        canViewReports: responseType === 'report' && customerId,
        aiPowered: true
      };
    }
  } catch (error) {
    console.log('AI service unavailable, using structured responses:', error.message);
  }

  // Fallback to structured responses with real customer data if available
  const responses = {
    general: {
      message: "Hello! I'm here to help you with any questions about backflow testing and compliance. How can I assist you today?",
      suggestions: [
        "Schedule a backflow test",
        "Check my compliance status", 
        "Understand test results",
        "Learn about regulations"
      ]
    },
    scheduling: {
      message: "I can help you schedule a backflow testing appointment. Our certified technicians are available throughout the Puget Sound region. Would you like to see available times or do you have specific scheduling requirements?",
      suggestions: [
        "View available appointments",
        "Emergency testing needed",
        "Reschedule existing appointment",
        "Multiple devices to test"
      ]
    },
    compliance: {
      message: "Washington State requires annual testing of backflow prevention devices. I can help you understand the requirements and ensure your devices are compliant. What specific compliance questions do you have?",
      suggestions: [
        "When is my next test due?",
        "What happens if I'm not compliant?",
        "Water district requirements",
        "Device certification status"
      ]
    },
    billing: {
      message: "I can help you with billing questions and payment options. We offer competitive rates with transparent pricing. What billing information do you need?",
      suggestions: [
        "View my invoices",
        "Payment methods accepted",
        "Service pricing",
        "Insurance coverage"
      ]
    },
    report: {
      message: "I can help you understand your backflow test results and compliance documentation. Test reports include device status, any issues found, and next steps. What specific questions do you have about your results?",
      suggestions: [
        "Explain test results",
        "Download compliance certificate", 
        "Failed test next steps",
        "Share with water district"
      ]
    }
  };

  const response = responses[responseType as keyof typeof responses] || responses.general;

  return {
    message: response.message,
    suggestions: response.suggestions,
    responseType,
    timestamp: new Date().toISOString(),
    canSchedule: responseType === 'scheduling',
    canViewReports: responseType === 'report' && customerId,
    aiPowered: false
  };
}

function transformInsightToCustomerResponse(message: string, responseType: string, aiInsight: any): {
  message: string;
  suggestions: string[];
} {
  // Transform AI business insights into customer-friendly responses
  const customerFriendlyMessage = aiInsight.insight
    .replace(/revenue/gi, 'service costs')
    .replace(/business metrics/gi, 'service quality')
    .replace(/operational efficiency/gi, 'faster service')
    .replace(/customer retention/gi, 'customer satisfaction');

  const contextualSuggestions = {
    scheduling: [
      "Schedule a backflow test",
      "View available times",
      "Emergency testing needed",
      "Multiple devices to test"
    ],
    compliance: [
      "When is my next test due?",
      "Washington State requirements",
      "Water district submissions",
      "Device certification status"
    ],
    billing: [
      "View my invoices",
      "Payment methods",
      "Service pricing information",
      "Insurance coverage"
    ],
    report: [
      "Explain my test results",
      "Download compliance certificate",
      "Failed test next steps",
      "Share with water district"
    ],
    general: [
      "Schedule an appointment",
      "Check compliance status",
      "Understand regulations",
      "Get pricing information"
    ]
  };

  return {
    message: `Based on your question about ${message.toLowerCase()}, here's what I can help you with: ${customerFriendlyMessage.substring(0, 200)}...`,
    suggestions: contextualSuggestions[responseType as keyof typeof contextualSuggestions] || contextualSuggestions.general
  };
}