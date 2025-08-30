#!/bin/bash

# Fisher Backflows MCP Server Control Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.mcp-server.pid"
LOG_FILE="$SCRIPT_DIR/mcp-server.log"

case "$1" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "MCP Server is already running (PID: $(cat "$PID_FILE"))"
      exit 1
    fi
    
    echo "Starting Fisher Backflows MCP Server..."
    nohup node "$SCRIPT_DIR/mcp-server.js" > "$LOG_FILE" 2>&1 & 
    echo $! > "$PID_FILE"
    echo "MCP Server started with PID: $(cat "$PID_FILE")"
    echo "Logs: $LOG_FILE"
    ;;
    
  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        rm -f "$PID_FILE"
        echo "MCP Server stopped (PID: $PID)"
      else
        echo "MCP Server is not running"
        rm -f "$PID_FILE"
      fi
    else
      echo "MCP Server is not running"
    fi
    ;;
    
  status)
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
      echo "MCP Server is running (PID: $(cat "$PID_FILE"))"
    else
      echo "MCP Server is not running"
    fi
    ;;
    
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
    
  logs)
    if [ -f "$LOG_FILE" ]; then
      tail -f "$LOG_FILE"
    else
      echo "No log file found"
    fi
    ;;
    
  test)
    echo "Testing MCP Server tools..."
    echo "Available tools should include:"
    echo "- read_project_file"
    echo "- list_project_files"
    echo "- get_project_status"
    echo "- get_api_endpoints"
    echo "- get_database_schema"
    echo "- run_command"
    echo ""
    echo "Run './mcp-control.sh start' first, then configure in Claude Code"
    ;;
    
  *)
    echo "Fisher Backflows MCP Server Control"
    echo "Usage: $0 {start|stop|status|restart|logs|test}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the MCP server"
    echo "  stop    - Stop the MCP server"
    echo "  status  - Check server status"
    echo "  restart - Restart the server"
    echo "  logs    - Show server logs"
    echo "  test    - Show test information"
    ;;
esac