// createServer.js
import { registerSearchTool } from './tools/search.js';
import { registerFetchTool } from './tools/fetch.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createMcpServer() {
  const server = new McpServer({ name: 'dcinside-mcp', version: '1.0.0' });

  // 최소 로깅: 각 도구가 호출될 때 도구 이름만 한 줄로 출력합니다.
  try {
    const orig = server.registerTool && server.registerTool.bind(server);
    if (orig) {
      server.registerTool = (name, meta, handler) => {
        const wrapped = async (input, context) => {
          try {
            const maxLen = 1000;
            let preview = '';
            try {
              preview = JSON.stringify(input);
            } catch (e) {
              try { preview = String(input); } catch (e2) { preview = '[unserializable]'; }
            }
            if (typeof preview === 'string' && preview.length > maxLen) preview = preview.slice(0, maxLen) + '...';
            try { console.log(`[MCP] tool invoked: ${name} payload=${preview}`); } catch (e) {}
          } catch (e) {
          }
          return handler(input, context);
        };
        return orig(name, meta, wrapped);
      };
    }
  } catch (e) {
    // 실패 시에도 동작하도록 그냥 넘어갑니다.
  }

  registerSearchTool(server);
  registerFetchTool(server);

  return server;
}

