# Working Test Cases - Ready to Execute

## Local Working Tests (Copy-Paste Ready)

### **Complete Local Flow Test** ✅
```bash
TIMESTAMP=$(date +%s) && EMAIL="local${TIMESTAMP}@test.com" && \
echo "Testing: ${EMAIL}" && \
curl -X POST http://localhost:3010/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Local\",
    \"lastName\": \"Test\",
    \"email\": \"${EMAIL}\",
    \"phone\": \"555-111-2222\",
    \"password\": \"LocalTest123\",
    \"address\": {
      \"street\": \"123 Local St\",
      \"city\": \"Austin\",
      \"state\": \"TX\",
      \"zipCode\": \"78701\"
    }
  }" \
  -s -o /dev/null -w "Register: %{http_code}\n" && \
sleep 1 && \
curl "http://localhost:3010/api/auth/verify-simple?email=${EMAIL}" \
  -s -o /dev/null -w "Verify: %{http_code}\n" && \
sleep 1 && \
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"LocalTest123\"
  }" \
  -s -w "\nLogin: %{http_code}\n"
```
**Expected Result**: Register: 201, Verify: 307, Login: 200

### **Working Registration Endpoint Test** ✅
```bash
curl -X POST http://localhost:3010/api/working-register \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Working\",
    \"lastName\": \"Test\",
    \"email\": \"working$(date +%s)@test.com\",
    \"phone\": \"555-333-4444\",
    \"password\": \"WorkingTest123\"
  }" \
  -s -w "\nStatus: %{http_code}\n"
```

### **Minimal Registration Test** ✅
```bash
curl -X POST http://localhost:3010/api/minimal-register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"minimal$(date +%s)@test.com\",
    \"password\": \"MinimalTest123\"
  }" \
  -s -w "\nStatus: %{http_code}\n"
```

## Production Problem Tests

### **Production Main Registration** (❌ Hash not stored)
```bash
TIMESTAMP=$(date +%s) && EMAIL="prod${TIMESTAMP}@test.com" && \
curl -X POST https://www.fisherbackflows.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Prod\",
    \"lastName\": \"Test\",
    \"email\": \"${EMAIL}\",
    \"phone\": \"555-555-5555\",
    \"password\": \"ProdTest123456\",
    \"address\": {
      \"street\": \"123 Prod St\",
      \"city\": \"Austin\",
      \"state\": \"TX\",
      \"zipCode\": \"78701\"
    }
  }" \
  -s -o /dev/null -w "Register: %{http_code}\n" && \
curl "https://www.fisherbackflows.com/api/auth/verify-simple?email=${EMAIL}" \
  -s -o /dev/null -w "Verify: %{http_code}\n" && \
curl -X POST https://www.fisherbackflows.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"ProdTest123456\"}" \
  -s -w "\nLogin: %{http_code}\n"
```
**Current Result**: Register: 201, Verify: 307, Login: 500

### **Production New Endpoints** (❌ 405 Not Found)
```bash
# Test if working-register is deployed
curl -X POST https://www.fisherbackflows.com/api/working-register \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@test.com\",\"phone\":\"555-0000\",\"password\":\"TestPass123\"}" \
  -s -w "Status: %{http_code}\n"

# Test if fix-password is deployed  
curl -X POST https://www.fisherbackflows.com/api/fix-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"TestPass123\"}" \
  -s -w "Status: %{http_code}\n"
```
**Current Result**: 405 Method Not Allowed

## Quick Diagnostic Commands

### **Check Local Server**
```bash
curl -s http://localhost:3010/api/auth/register -w "Status: %{http_code}\n" | head -1
curl -s http://localhost:3010/api/working-register -w "Status: %{http_code}\n" | head -1
curl -s http://localhost:3010/api/minimal-register -w "Status: %{http_code}\n" | head -1
```

### **Check Production Deployments**
```bash
curl -s https://www.fisherbackflows.com/api/auth/register -w "Status: %{http_code}\n" | head -1
curl -s https://www.fisherbackflows.com/api/working-register -w "Status: %{http_code}\n" | head -1  
curl -s https://www.fisherbackflows.com/api/fix-password -w "Status: %{http_code}\n" | head -1
```

### **Force Production Deployment**
```bash
vercel --prod --force
# Wait 60 seconds then test endpoints
```

### **Check Recent Deployments**
```bash
vercel ls | head -10
```

## Debug Commands

### **View Local Server Logs**
```bash
# If background process still running:
ps aux | grep "npm run dev"
# Get dev server output for recent tests
```

### **Check Git Status**  
```bash
git status
git log --oneline -5
```

### **Start Fresh Dev Server**
```bash
npm run dev
# Then test endpoints
```

## Success Criteria

### **Local Environment** ✅ 
- All registration endpoints return 201
- Verification returns 307  
- Login returns 200 with user data

### **Production Target** 🎯
- Registration stores password hash (not NULL)
- Verification activates account
- Login authenticates successfully (200, not 500)

## Known Working Components
1. **Hash Generation**: SHA-256 + salt works everywhere
2. **Login Logic**: Password verification works when hash exists  
3. **Database Schema**: Accepts password_hash field
4. **Verification System**: Email verification activates accounts
5. **Local Development**: Complete flow working perfectly

## Known Issues  
1. **Production Hash Storage**: Main registration not storing password_hash
2. **Endpoint Deployment**: New endpoints returning 405 
3. **Build/Deploy**: Some deployment issue preventing new endpoints

---
**Ready State**: All test cases prepared, local environment working, clear path to production fix