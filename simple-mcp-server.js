#!/usr/bin/env node

/**
 * Simple Fisher Backflows Platform MCP Server
 * Provides basic context about the platform for Claude Code
 */

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = process.cwd();

// Simple MCP server implementation
class SimpleMCPServer {
  constructor() {
    this.tools = new Map();
    this.setupTools();
  }

  setupTools() {
    // Read project file
    this.tools.set('read_project_file', async (args) => {
      const filePath = args.path;
      const fullPath = path.join(PROJECT_ROOT, filePath);
      
      // Security check
      if (!fullPath.startsWith(PROJECT_ROOT)) {
        throw new Error('Access denied: File outside project directory');
      }
      
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        return `File: ${filePath}\n\n${content}`;
      } catch (error) {
        throw new Error(`Cannot read file: ${error.message}`);
      }
    });

    // List project files
    this.tools.set('list_project_files', async (args) => {
      const directory = args.directory || '.';
      const pattern = args.pattern;
      const fullPath = path.join(PROJECT_ROOT, directory);
      
      if (!fullPath.startsWith(PROJECT_ROOT)) {
        throw new Error('Access denied: Directory outside project');
      }
      
      try {
        let files = await fs.readdir(fullPath);
        
        if (pattern) {
          const regex = new RegExp(pattern);
          files = files.filter(f => regex.test(f));
        }
        
        const result = await Promise.all(files.map(async (file) => {
          const filePath = path.join(fullPath, file);
          try {
            const stats = await fs.stat(filePath);
            return {
              name: file,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          } catch {
            return { name: file, type: 'unknown' };
          }
        }));
        
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(`Cannot list directory: ${error.message}`);
      }
    });

    // Get project status
    this.tools.set('get_project_status', async () => {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const envPath = path.join(PROJECT_ROOT, '.env.local');
      
      const status = {
        project: 'Fisher Backflows Platform',
        root: PROJECT_ROOT,
        timestamp: new Date().toISOString()
      };
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        status.name = packageJson.name;
        status.version = packageJson.version;
        status.scripts = Object.keys(packageJson.scripts || {});
      } catch {
        status.error = 'Could not read package.json';
      }
      
      try {
        await fs.access(envPath);
        status.hasEnvFile = true;
      } catch {
        status.hasEnvFile = false;
      }
      
      return JSON.stringify(status, null, 2);
    });

    // Get API endpoints
    this.tools.set('get_api_endpoints', async () => {
      const apiDir = path.join(PROJECT_ROOT, 'src/app/api');
      const endpoints = [];
      
      const scanDirectory = async (dir, prefix = '') => {
        try {
          const items = await fs.readdir(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
              await scanDirectory(itemPath, `${prefix}/${item}`);
            } else if (item === 'route.ts' || item === 'route.js') {
              endpoints.push(`/api${prefix}`);
            }
          }
        } catch (error) {
          // Directory doesn't exist or can't be read
        }
      };
      
      await scanDirectory(apiDir);
      
      return JSON.stringify({
        total: endpoints.length,
        endpoints: endpoints.sort()
      }, null, 2);
    });
  }

  async handleRequest(method, params) {
    if (method === 'tools/list') {
      return {
        tools: Array.from(this.tools.keys()).map(name => ({
          name,
          description: `Fisher Backflows Platform tool: ${name}`
        }))
      };
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const tool = this.tools.get(name);
      
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }
      
      try {
        const result = await tool(args || {});
        return {
          content: [{ type: 'text', text: result }]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
    
    throw new Error(`Unknown method: ${method}`);
  }

  start() {
    console.log('Fisher Backflows MCP Server starting...');
    console.log(`Project root: ${PROJECT_ROOT}`);
    console.log(`Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
    
    // For Claude Code integration, we keep the process running
    setInterval(() => {
      // Keep alive
    }, 1000);
  }
}

// Start the server
const server = new SimpleMCPServer();
server.start();