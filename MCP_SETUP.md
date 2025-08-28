# Supabase MCP Integration Setup

## Overview
This project uses Supabase Model Context Protocol (MCP) integration for enhanced database capabilities and AI-assisted development.

## Configuration

### MCP Server Setup
The `.mcp.json` file contains the configuration for Claude Code to connect to Supabase:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=jvhbqfueutvfepsjmztx"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "[REDACTED]"
      }
    }
  }
}
```

### Project Details
- **Project Reference**: `jvhbqfueutvfepsjmztx`
- **Database URL**: `https://jvhbqfueutvfepsjmztx.supabase.co`
- **Access Mode**: Read-only (for security)

### Capabilities
With MCP integration, you can:
- Query database schema directly
- Inspect table structures and relationships
- Debug database issues with AI assistance
- Get real-time database insights
- Perform complex database analysis

### Security
- Uses read-only access for safety
- Personal access token is secured in `.mcp.json` (gitignored)
- Scoped to specific project only
- No write access to production data

### Usage
The MCP server runs automatically when Claude Code starts and provides enhanced database context for development and debugging tasks.

## Tables Available
Based on the current schema:
- `team_users` - Team member authentication
- `team_sessions` - Session management
- `tester_schedules` - Technician scheduling
- `time_off_requests` - Time off management

## Notes
- The `.mcp.json` file is gitignored to protect sensitive tokens
- MCP runs in read-only mode for security
- Configuration is project-specific to Fisher Backflows