# 🤖 AI Features Setup Guide - Real Data Integration

## 🎯 Overview
This guide shows you how to connect Fisher Backflows AI features to **real data** instead of mock responses.

## 🔍 Current Status
**✅ ALREADY CONNECTED TO REAL DATA**: Your AI features are already pulling from your Supabase database:
- Customer data from `customers` table
- Revenue data from `invoices` table  
- Appointment data from `appointments` table
- Device data from `devices` table

**The "mock responses" are only used when OpenAI API is not configured!**

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Your Data
```bash
npm run ai:verify-data
```
This will show you exactly what data you have and what AI features are ready.

### Step 2: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create account or sign in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 3: Configure API Key
Add to your `.env.local` file:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 4: Test Everything
```bash
npm run ai:setup
```

## 📊 Data Flow Explanation

### How Real Data is Used:

**Customer Communications:**
- Gets actual customer data: `first_name`, `device count`, `service history`
- Calculates real compliance scores from appointment history
- Uses actual device counts to determine customer type (residential/commercial)

**Business Insights:**
- Pulls real revenue from `invoices` table
- Analyzes actual appointment completion rates
- Calculates true customer acquisition and retention metrics

**Report Generation:**
- Uses real business metrics for executive summaries
- Includes actual compliance rates and revenue figures
- Generates insights based on your operational data

**Chat Support:**
- Personalizes responses using customer's actual data
- References real service history and device information
- Provides context-aware recommendations

### Mock vs Real Data Usage:

| Feature | Without OpenAI API | With OpenAI API |
|---------|-------------------|-----------------|
| Data Source | ✅ Real Supabase Data | ✅ Real Supabase Data |
| AI Responses | 📝 Intelligent templates | 🧠 GPT-4 generated |
| Personalization | ✅ Customer-specific | ✅ AI-enhanced personal |
| Business Logic | ✅ Real calculations | ✅ AI-interpreted insights |

## 🔧 Advanced Configuration

### OpenAI Model Settings (Optional)
In `.env.local`, you can configure:
```bash
# Model selection (gpt-4 is default)
OPENAI_MODEL=gpt-4

# Response creativity (0.0-1.0, default 0.3)
OPENAI_TEMPERATURE=0.3

# Max response length (default 2000)
OPENAI_MAX_TOKENS=2000
```

### Database Data Requirements

**Minimum Data for AI Features:**
- ✅ At least 1 customer record
- ✅ At least 1 appointment record  
- ✅ At least 1 invoice record

**Optimal Data for Full AI Intelligence:**
- 🎯 10+ customers with varied service history
- 🎯 50+ appointments with different statuses
- 🎯 20+ invoices with payment history
- 🎯 Multiple device types and test results

## 🧪 Testing Real Data Integration

### Test Customer Communication:
```bash
curl -X POST http://localhost:3010/api/ai/customer-communication \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "customerId": "actual-customer-id",
    "messageType": "reminder", 
    "tone": "professional"
  }'
```

### Test Business Insights:
```bash
curl -X POST http://localhost:3010/api/ai/insights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "query": "How is our revenue performing?",
    "context": "revenue",
    "timeframe": "30d"
  }'
```

### Test Report Generation:
```bash
curl -X POST http://localhost:3010/api/ai/generate-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "reportType": "executive-summary",
    "period": "Q1 2025",
    "format": "html"
  }'
```

## 🎯 What You'll See With Real Data

### Before (Mock Data):
```json
{
  "message": "Generic response about backflow testing",
  "aiPowered": false
}
```

### After (Real Data + OpenAI):
```json
{
  "message": "Based on your 3 commercial devices and 18-month service history with us, your next annual testing is due in 45 days. Your compliance score of 94/100 shows excellent maintenance of your backflow prevention systems.",
  "aiPowered": true,
  "personalizedInsights": [...]
}
```

## 🚨 Common Issues & Solutions

### Issue: "No data found"
**Solution:** Check your database has records:
```bash
npm run ai:verify-data
```

### Issue: "Mock responses still showing"
**Solutions:**
1. Verify OpenAI API key is correct (starts with `sk-`)
2. Check `.env.local` has no spaces around the `=`
3. Restart your development server: `npm run dev`

### Issue: "AI features not working"
**Solution:** Run the complete setup:
```bash
npm install
npm run ai:setup
npm run dev
```

### Issue: "Database connection failed"
**Solution:** Verify Supabase configuration:
- Check `NEXT_PUBLIC_SUPABASE_URL` 
- Check `SUPABASE_SERVICE_ROLE_KEY`
- Test with: `npm run ai:verify-data`

## 💰 Cost Estimation

### OpenAI API Costs (Approximate):
- **Customer Chat**: ~$0.01 per conversation
- **Business Insights**: ~$0.02 per query
- **Report Generation**: ~$0.05 per report  
- **Customer Communications**: ~$0.01 per message

**Typical Monthly Cost**: $10-50 depending on usage

### Cost Optimization Tips:
1. Set usage limits in OpenAI dashboard
2. Use lower temperature settings (0.2-0.3)
3. Implement response caching for common queries
4. Monitor usage in OpenAI dashboard

## 🏆 Success Indicators

You'll know it's working when you see:
- ✅ Personalized responses using customer names and data
- ✅ Real business metrics in insights and reports
- ✅ Context-aware recommendations based on service history  
- ✅ `"aiPowered": true` in API responses
- ✅ Unique, non-templated AI responses

## 📞 Support

If you need help:
1. Run `npm run ai:verify-data` and share the output
2. Check your browser console for error messages
3. Verify your `.env.local` configuration
4. Test with a simple curl command first

**Remember**: Even without OpenAI API, your AI features use real customer data from your database - they just use intelligent templates instead of GPT-generated responses!