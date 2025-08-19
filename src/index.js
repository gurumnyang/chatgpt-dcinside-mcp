import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './mcp/createServer.js';
import { config } from './config.js';


/** @type {Record<string, StreamableHTTPServerTransport>} */
const transports = {};

const app = express();

// JSON 페이로드 파서 (최대 1MB)
app.use(express.json({ limit: '1mb' }));

// Minimal CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', [
    'Content-Type',
    'mcp-session-id',
    'Mcp-Session-Id',
    'MCP-Session-Id',
    'MCP-Protocol-Version',
  ].join(', '));
  res.setHeader('Access-Control-Expose-Headers', [
    'mcp-session-id',
    'Mcp-Session-Id',
    'MCP-Session-Id',
  ].join(', '));
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(['/sse', '/sse/'], (req, _res, next) => {
  try {
    const h = req.headers || {};
  } catch {}
  next();
});

// POST /sse
app.post(['/sse', '/sse/'], async (req, res) => {
  try {
    const sessionIdHeader = /** @type {string|undefined} */ (req.headers['mcp-session-id']);

    let transport;
    if (sessionIdHeader && transports[sessionIdHeader]) {
      transport = transports[sessionIdHeader];
    } else if (!sessionIdHeader && isInitializeRequest(req.body)) {
      // 초기화 요청일 경우 새로운 transport 생성
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
      });

      // transport가 닫힐 때 세션 맵에서 제거
      transport.onclose = () => {
        if (transport.sessionId) delete transports[transport.sessionId];
      };

      const server = createMcpServer();
      await server.connect(transport, { keepAlive: true });
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);

    const sid = res.getHeader('Mcp-Session-Id') || res.getHeader('MCP-Session-Id') || res.getHeader('mcp-session-id');
    if (sid) {
      try { res.setHeader('Mcp-Session-Id', String(sid)); } catch {}
      try { res.setHeader('MCP-Session-Id', String(sid)); } catch {}
      try { res.setHeader('mcp-session-id', String(sid)); } catch {}
    }
  } catch (e) {
    console.error('POST /sse error:', e);
    if (!res.headersSent) res.status(500).json({ error: 'internal' });
  }
});

// GET, DELETE /sse
const handleSessionRequest = async (req, res) => {
  try {
  const sessionIdHeader = /** @type {string|undefined} */ (req.headers['mcp-session-id']);
    if (!sessionIdHeader || !transports[sessionIdHeader]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    const transport = transports[sessionIdHeader];
    await transport.handleRequest(req, res);
  } catch (e) {
    console.error(req.method, '/sse error:', e);
    if (!res.headersSent) res.status(500).end();
  }
};

app.get(['/sse', '/sse/'], handleSessionRequest);
app.delete(['/sse', '/sse/'], handleSessionRequest);

// 간단한 상태 엔드포인트
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'dcinside-mcp', version: '1.0.0', endpoint: '/sse' });
});

// 서버 시작
app.listen(config.port, () => {
  console.log(`MCP HTTP server ready on http://localhost:${config.port} (endpoint: /sse)`);
});

