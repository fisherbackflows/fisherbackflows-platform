# GitHub Actions High-Memory Deployment Setup

## 🎯 Problem Solved
Your Fisher Backflows platform builds successfully locally with optimized memory settings, but Vercel's 2GB memory limit causes deployment failures. GitHub Actions provides a free 7GB memory environment.

## 📋 Step-by-Step Setup

### Step 1: Update GitHub Personal Access Token

1. **Go to GitHub Settings**:
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"

2. **Configure Token Scopes**:
   ```
   ✅ repo (Full repository access)
   ✅ workflow (Update GitHub Actions workflows)  ← THIS IS CRITICAL
   ✅ write:packages (if needed)
   ```

3. **Replace Your Current Token**:
   ```bash
   # Update your git remote with the new token
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/fisherbackflows/fisherbackflows-platform.git
   ```

### Step 2: Deploy via GitHub Actions

Once the token is updated, simply run:
```bash
./deploy-github-actions.sh
```

This will:
- ✅ Commit any changes
- ✅ Push to GitHub (triggering the workflow)
- ✅ Build with 7GB memory allocation
- ✅ Deploy to Vercel production automatically

### Step 3: Monitor the Deployment

1. **Check Build Progress**:
   - Visit: https://github.com/fisherbackflows/fisherbackflows-platform/actions
   - Watch the "Build and Deploy to Vercel" workflow

2. **Expected Timeline**:
   - Build: ~3-5 minutes (with 7GB memory)
   - Deploy: ~1-2 minutes
   - Total: ~5-7 minutes

### Step 4: Verify Success

The workflow will:
1. ✅ Checkout code
2. ✅ Setup Node.js 18 with npm cache
3. ✅ Install dependencies (`npm ci`)
4. ✅ Build with `NODE_OPTIONS="--max-old-space-size=7168"`
5. ✅ Deploy to Vercel production
6. ✅ Provide deployment URL

## 🔧 Current Workflow Configuration

Your `.github/workflows/deploy.yml` is already optimized:

```yaml
- name: Build application with high memory
  run: |
    export NODE_OPTIONS="--max-old-space-size=7168"
    npm run build
  env:
    NEXT_TELEMETRY_DISABLED: 1
```

## ✅ Benefits of This Solution

- **🆓 Free**: No additional costs
- **⚡ Fast**: 3-5 minute builds vs. local 8GB+ builds
- **🔒 Secure**: Automated with proper token scoping
- **📊 Reliable**: GitHub's infrastructure handles memory limits
- **🔄 Automated**: Push to deploy, no manual intervention

## 🚨 If You Still Get Token Errors

Alternative approaches:
1. **Manual GitHub Upload**: Upload workflow file directly via GitHub web UI
2. **Vercel Pro Upgrade**: $20/month for 6GB memory limit
3. **Docker Deployment**: Use provided Dockerfile on Railway/Render

## 📞 Next Steps

1. Update your GitHub token with `workflow` scope
2. Run `./deploy-github-actions.sh`
3. Monitor the build at GitHub Actions
4. Enjoy automated high-memory deployments! 🎉