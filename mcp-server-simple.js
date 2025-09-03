#!/usr/bin/env node

/**
 * Fisher Backflows Platform MCP Server - Simplified
 */

const { Server } = require('./node_modules/@modelcontextprotocol/sdk/dist/cjs/server/index.js');
const { StdioServerTransport } = require('./node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');

class FisherBackflowsMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.server = new Server({
      name: 'fisher-backflows-platform',
      version: '1.0.0'
    });
    
    this.setupHandlers();
  }

  setupHandlers() {
    // Handle list_tools request
    this.server.request = async (method, params) => {
      console.error(`Received request: ${method}`, params);
      
      if (method === 'tools/list') {
        return {
          tools: [
            {
              name: 'read_project_file',
              description: 'Read a file from the Fisher Backflows project',
              inputSchema: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    description: 'Relative path to file from project root'
                  }
                },
                required: ['path']
              }
            },
            {
              name: 'get_project_status',
              description: 'Get current project development status',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };
      }
      
      if (method === 'tools/call') {
        const { name, arguments: args } = params;
        
        if (name === 'read_project_file') {
          return await this.readProjectFile(args.path);
        }
        
        if (name === 'get_project_status') {
          return await this.getProjectStatus();
        }
      }
      
      throw new Error(`Unknown method: ${method}`);
    };
  }

  async readProjectFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    
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

  async getProjectStatus() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));

      const status = {
        project: packageJson.name,
        version: packageJson.version,
        node_version: process.version,
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

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Fisher Backflows Platform MCP Server is running...');
    console.error(`Project root: ${this.projectRoot}`);
  }
}

async function main() {
  const server = new FisherBackflowsMCPServer();
  await server.start();
}

main().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});