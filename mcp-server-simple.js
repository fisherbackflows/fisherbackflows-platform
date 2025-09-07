#!/usr/bin/env node
// Minimal MCP server exposing read-only project tools
// Do not include secrets or write operations.

const path = require('path');
const fs = require('fs');
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');

const ROOT = path.resolve(__dirname);
const APP_ROOT = ROOT; // server sits in project root

function safePath(p) {
  const full = path.resolve(APP_ROOT, p);
  if (!full.startsWith(APP_ROOT)) {
    throw new Error('Path traversal not allowed');
  }
  return full;
}

function listFiles(dir = '.') {
  const base = safePath(dir);
  const out = [];
  (function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const rel = path.relative(APP_ROOT, path.join(current, e.name));
      if (e.isDirectory()) {
        // Skip large or irrelevant folders
        if (["node_modules", ".next", ".git", "playwright-report", ".vercel"].includes(e.name)) continue;
        walk(path.join(current, e.name));
      } else {
        out.push(rel);
      }
    }
  })(base);
  return out.sort();
}

function getApiEndpoints() {
  // Heuristic: Next.js route handlers under src/app/api
  const apiDir = safePath('src/app/api');
  const endpoints = [];
  if (fs.existsSync(apiDir)) {
    const files = listFiles('src/app/api');
    for (const f of files) {
      if (f.endsWith('/route.ts') || f.endsWith('/route.js')) {
        endpoints.push('/' + f.replace(/^src\/app/, '').replace(/\/route\.(ts|js)$/,'').replace(/\\/g,'/'));
      }
    }
  }
  return endpoints;
}

function getDatabaseSchema() {
  const supabaseSchema = safePath('supabase/schema.sql');
  const migrationsDir = safePath('supabase/migrations');
  const results = [];
  if (fs.existsSync(supabaseSchema)) {
    results.push({ file: 'supabase/schema.sql', sql: fs.readFileSync(supabaseSchema, 'utf8') });
  }
  if (fs.existsSync(migrationsDir)) {
    for (const f of fs.readdirSync(migrationsDir)) {
      const p = path.join(migrationsDir, f);
      if (fs.statSync(p).isFile() && f.endsWith('.sql')) {
        results.push({ file: `supabase/migrations/${f}`, sql: fs.readFileSync(p, 'utf8') });
      }
    }
  }
  return results;
}

const server = new Server({
  name: 'fisherbackflows-mcp-server',
  version: '0.1.0',
});

server.tool('list_project_files', 'List project files (filtered)', async () => {
  return { files: listFiles('.') };
});

server.tool('read_project_file', 'Read a text file by relative path', async (req) => {
  const { path: relPath } = req.params || {};
  if (!relPath) throw new Error('path required');
  const full = safePath(relPath);
  const data = fs.readFileSync(full, 'utf8');
  return { path: relPath, content: data };
});

server.tool('get_project_status', 'Basic repo status summary', async () => {
  const pkgPath = safePath('package.json');
  const inApp = fs.existsSync(pkgPath);
  const status = {
    appRoot: APP_ROOT,
    hasPackageJson: inApp,
    hasNext: inApp ? /"next"\s*:/.test(fs.readFileSync(pkgPath, 'utf8')) : false,
    envExample: fs.existsSync(safePath('.env.example')),
  };
  return status;
});

server.tool('get_api_endpoints', 'Infer Next.js API endpoints', async () => {
  return { endpoints: getApiEndpoints() };
});

server.tool('get_database_schema', 'Return schema and migrations', async () => {
  return { files: getDatabaseSchema() };
});

// No shell/run_command tool for safety.

const transport = new StdioServerTransport();
server.connect(transport);

