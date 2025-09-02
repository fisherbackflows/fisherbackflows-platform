#!/usr/bin/env node

/**
 * Fisher Backflows Platform MCP Server
 * Provides enhanced context and capabilities for development
 */

const { Server } = require('@modelcontextprotocol/sdk/dist/cjs/server/index');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { z } = require('zod');

const execAsync = promisify(exec);

class FisherBackflowsMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.server = new Server({
      name: 'fisher-backflows-platform',
      version: '1.0.0'
    });
    
    this.setupTools();
  }

  setupTools() {
    // Tool to read project files
    this.server.registerTool('read_project_file', {
      description: 'Read a file from the Fisher Backflows project',
      inputSchema: {
        path: z.string().describe('Relative path to file from project root')
      }
    }, async ({ path: filePath }) => {
      return await this.readProjectFile(filePath);
    });

    // Tool to list project files
    this.server.registerTool('list_project_files', {
      description: 'List files in a project directory',
      inputSchema: {
        directory: z.string().default('.').describe('Directory path relative to project root'),
        pattern: z.string().optional().describe('File pattern to match (optional)')
      }
    }, async ({ directory = '.', pattern }) => {
      return await this.listProjectFiles(directory, pattern);
    });

    // Tool to get project status
    this.server.registerTool('get_project_status', {
      description: 'Get current project development status',
      inputSchema: {}
    }, async () => {
      return await this.getProjectStatus();
    });

    // Tool to get API endpoints
    this.server.registerTool('get_api_endpoints', {
      description: 'List all API endpoints in the project',
      inputSchema: {}
    }, async () => {
      return await this.getAPIEndpoints();
    });

    // Tool to get database schema info
    this.server.registerTool('get_database_schema', {
      description: 'Get database schema information',
      inputSchema: {}
    }, async () => {
      return await this.getDatabaseSchema();
    });

    // Tool to run safe development commands
    this.server.registerTool('run_command', {
      description: 'Run a safe development command in the project',
      inputSchema: {
        command: z.string().describe('Command to run (limited to safe dev commands)')
      }
    }, async ({ command }) => {
      return await this.runCommand(command);
    });
  }

  async readProjectFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    
    // Security check - ensure file is within project
    if (!fullPath.startsWith(this.projectRoot)) {
      throw new Error('Access denied: File outside project directory');
    }

    try {
      const content = await fs.readFile(fullPath, 'utf8');
      return {
        content: [{
          type: 'text',
          text: `File: ${filePath}\n\n${content}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error reading ${filePath}: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async listProjectFiles(directory = '.', pattern) {
    const fullPath = path.join(this.projectRoot, directory);
    
    if (!fullPath.startsWith(this.projectRoot)) {
      throw new Error('Access denied: Directory outside project');
    }

    try {
      let files = await fs.readdir(fullPath, { withFileTypes: true });
      
      if (pattern) {
        const regex = new RegExp(pattern);
        files = files.filter(file => regex.test(file.name));
      }

      const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file',
        path: path.join(directory, file.name)
      }));

      return {
        content: [{
          type: 'text',
          text: `Files in ${directory}:\n\n${JSON.stringify(fileList, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing directory ${directory}: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async getProjectStatus() {
    try {
      // Get package.json info
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));

      // Check if dev server is running
      let serverStatus = 'stopped';
      try {
        const { stdout } = await execAsync('lsof -ti:3010', { cwd: this.projectRoot });
        if (stdout.trim()) {
          serverStatus = 'running on port 3010';
        }
      } catch (e) {
        // Server not running
      }

      // Get git status
      let gitStatus = 'unknown';
      try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectRoot });
        const changes = stdout.trim().split('\n').filter(line => line.trim());
        gitStatus = changes.length > 0 ? `${changes.length} changes` : 'clean';
      } catch (e) {
        gitStatus = 'not a git repository';
      }

      const status = {
        project: packageJson.name,
        version: packageJson.version,
        node_version: process.version,
        dev_server: serverStatus,
        git_status: gitStatus,
        platform: process.platform,
        architecture: process.arch,
        working_directory: this.projectRoot
      };

      return {
        content: [{
          type: 'text',
          text: `Fisher Backflows Platform Status:\n\n${JSON.stringify(status, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting project status: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async getAPIEndpoints() {
    try {
      const apiPath = path.join(this.projectRoot, 'src/app/api');
      const endpoints = await this.findAPIEndpoints(apiPath, 'api');

      return {
        content: [{
          type: 'text',
          text: `Fisher Backflows API Endpoints:\n\n${JSON.stringify(endpoints, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting API endpoints: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async findAPIEndpoints(dir, prefix = '') {
    const endpoints = [];
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const subEndpoints = await this.findAPIEndpoints(
            path.join(dir, item.name), 
            `${prefix}/${item.name}`
          );
          endpoints.push(...subEndpoints);
        } else if (item.name === 'route.ts' || item.name === 'route.js') {
          // Found an API route
          const routePath = prefix === 'api' ? '/' : prefix.substring(3); // Remove 'api' prefix
          const filePath = path.join(dir, item.name);
          
          // Try to read the file and determine HTTP methods
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const methods = [];
            
            if (content.includes('export async function GET')) methods.push('GET');
            if (content.includes('export async function POST')) methods.push('POST');
            if (content.includes('export async function PUT')) methods.push('PUT');
            if (content.includes('export async function DELETE')) methods.push('DELETE');
            if (content.includes('export async function PATCH')) methods.push('PATCH');
            
            endpoints.push({
              path: `/api${routePath}`,
              methods,
              file: path.relative(this.projectRoot, filePath)
            });
          } catch (e) {
            // Skip files we can't read
            endpoints.push({
              path: `/api${routePath}`,
              methods: ['unknown'],
              file: path.relative(this.projectRoot, filePath)
            });
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return endpoints;
  }

  async getDatabaseSchema() {
    try {
      const schemaInfo = {
        type: 'Supabase PostgreSQL',
        connection: 'configured via .env.local',
        discovered_tables: []
      };

      // Check for test files that might reveal table structure
      const testFiles = [
        'test-test-reports-table.js',
        'create-real-test-reports.js',
        'create-real-appointments.js',
        'create-real-customers.js'
      ];

      const knownTables = [];
      for (const file of testFiles) {
        try {
          const filePath = path.join(this.projectRoot, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Extract table names from test files
          const tableMatches = content.match(/\.from\(['"`](\w+)['"`]\)/g);
          if (tableMatches) {
            tableMatches.forEach(match => {
              const tableName = match.match(/\.from\(['"`](\w+)['"`]\)/)[1];
              if (!knownTables.includes(tableName)) {
                knownTables.push(tableName);
              }
            });
          }
        } catch (e) {
          // File doesn't exist or can't read, continue
        }
      }

      schemaInfo.discovered_tables = knownTables;

      return {
        content: [{
          type: 'text',
          text: `Fisher Backflows Database Schema:\n\n${JSON.stringify(schemaInfo, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting database schema: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async runCommand(command) {
    // Security: only allow safe development commands
    const allowedCommands = [
      'npm run dev',
      'npm run build', 
      'npm run lint',
      'npm run test',
      'git status',
      'git log --oneline -10',
      'ls -la',
      'pwd',
      'node --version',
      'npm --version'
    ];

    if (!allowedCommands.some(allowed => command.startsWith(allowed))) {
      return {
        content: [{
          type: 'text',
          text: `Command not allowed: ${command}\n\nAllowed commands:\n${allowedCommands.join('\n')}`
        }],
        isError: true
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.projectRoot,
        timeout: 30000 // 30 second timeout
      });

      return {
        content: [{
          type: 'text',
          text: `Command: ${command}\n\nOutput:\n${stdout}\n${stderr ? `\nErrors:\n${stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Command failed: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Fisher Backflows Platform MCP Server is running...');
    console.error(`Project root: ${this.projectRoot}`);
  }
}

// Start the server
async function main() {
  const server = new FisherBackflowsMCPServer();
  await server.start();
}

main().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});