#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerFeedTool, registerStatusTool } from './tools/session.js';
import { getProjectIdentity } from './project.js';

const server = new McpServer({
  name: 'aimonsters',
  version: '0.1.0',
});

// Register tools
registerFeedTool(server);
registerStatusTool(server);

// Start server
async function main() {
  const project = getProjectIdentity();
  console.error(`[aimonsters] 🐉 MCP server starting for project: ${project.name} (${project.id})`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[aimonsters] ✅ MCP server connected via stdio');
}

main().catch((error) => {
  console.error('[aimonsters] Fatal error:', error);
  process.exit(1);
});
