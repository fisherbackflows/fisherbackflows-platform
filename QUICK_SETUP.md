# Quick Setup Guide - Fisher Backflows

## To Run on Another Computer with Claude Code

### 1. Clone/Transfer the Repository
```bash
# If using git (recommended)
git clone [your-repo-url]
cd fisherbackflows

# Or copy the entire project folder from your phone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory with:

```env
# Supabase Configuration - Replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Update `NEXT_PUBLIC_APP_URL` to match your computer's address (usually `http://localhost:3000` for local development)

### 4. Run the Development Server
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Project Structure
- Next.js 15.5.0 application
- Supabase for backend/database
- Tailwind CSS for styling
- TypeScript

## Common Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## Troubleshooting
1. **Port 3000 already in use**: Change the port with `npm run dev -- -p 3001`
2. **Supabase connection issues**: Verify your Supabase credentials in `.env.local`
3. **Module not found errors**: Run `npm install` again

## Current Git Status
Your project has uncommitted changes. Before transferring:
1. Commit your changes: `git add . && git commit -m "Your message"`
2. Push to a remote repository: `git push`

This will make it easy to clone on your computer.