# MCP Server Setup for WSL - Fisher Backflows Platform

## Overview
This guide sets up a Model Context Protocol (MCP) server in WSL to provide enhanced development capabilities for the Fisher Backflows Platform.

## ✅ Installation Complete!

The MCP server has been successfully set up with the following components:

### Files Created
- **`mcp-server.js`** - Main MCP server implementation
- **`mcp-control.sh`** - Control script for server management
- **`mcp-config.json`** - Configuration file
- **`~/.config/claude-code/mcp-servers.json`** - Claude Code integration config

### Server Features
- **File Operations**: Read project files securely
- **Directory Listing**: Browse project structure with filtering
- **Project Status**: Real-time development environment status
- **API Documentation**: Automatic endpoint discovery (47 endpoints found)
- **Database Schema**: Discovery of table structure from existing code
- **Safe Commands**: Execute approved development commands

## Usage

### Start/Stop Server
```bash
# Start MCP server
./mcp-control.sh start

# Stop MCP server
./mcp-control.sh stop

# Check status
./mcp-control.sh status

# View logs
./mcp-control.sh logs
```

### Available MCP Tools
1. **`read_project_file`** - Read any project file
2. **`list_project_files`** - List directory contents with optional filtering
3. **`get_project_status`** - Get development environment status
4. **`get_api_endpoints`** - List all 47 discovered API endpoints
5. **`get_database_schema`** - Show discovered database tables
6. **`run_command`** - Execute safe development commands

### Claude Code Integration
The server is automatically configured for Claude Code at:
`~/.config/claude-code/mcp-servers.json`

**To activate:**
1. Restart Claude Code
2. The MCP server will be available automatically
3. Claude will have enhanced context about the Fisher Backflows Platform

## Technical Details

### Discovered Capabilities
- **Project**: Fisher Backflows Platform v0.1.0
- **API Endpoints**: 47 discovered endpoints
- **Database Tables**: customers, appointments, devices, test_reports, team_users, team_sessions, testing_workflows
- **Dev Server**: Automatic detection of port 3010 status
- **Git Integration**: Repository status and change detection

### Security Features
- Path validation (project directory only)
- Command whitelist (safe development commands only)
- No write access to sensitive files
- Environment variable protection

### Performance
- Async operations for all file system calls
- Error handling with graceful fallbacks
- 30-second timeout for command execution
- Efficient recursive directory scanning

## Next Steps
The MCP server is ready to use! It will provide enhanced context to Claude Code for:
- Better understanding of project structure
- Real-time development status
- API endpoint awareness
- Database schema knowledge
- Safe command execution

**Status: ✅ FULLY OPERATIONAL**