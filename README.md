# dcinside-mcp

DCInside 갤러리를 ChatGPT MCP 커넥터 사양(search/fetch)으로 노출하는 Node.js 기반 원격 MCP 서버입니다. 데이터 수집은 `@gurumnyang/dcinside.js`를 사용하고, 전송은 MCP Streamable HTTP(`/sse`)를 사용합니다.

구조는 유지보수 용이성을 위해 다음과 같이 분리되었습니다.

- `src/index.js`: HTTP 엔드포인트(`/sse`) 및 세션 라우팅
- `src/config.js`: 환경변수 로딩 및 기본값
- `src/mcp/createServer.js`: MCP 서버 생성 및 도구 등록
- `src/mcp/tools/search.js`: `search` 도구 구현
- `src/mcp/tools/fetch.js`: `fetch` 도구 구현

## 요구 사항

- Node.js 18+

## 설치

프로젝트 루트에서 의존성 설치 후 `.env`를 준비하세요.

```bash
npm install
cp .env.example .env
```

`.env`에서 기본 갤러리 ID 등을 설정합니다.

## 환경 변수

- `PORT` (기본 3000)
- `DEFAULT_GALLERY_ID` (기본 programming)
- `MAX_SEARCH_RESULTS` (선택, 기본 10)
- `SEARCH_PAGES` (선택, 기본 3)
- `REQUEST_DELAY_MS` (선택, 기본 100)

## 실행

```bash
npm run start
```

서버가 `http://localhost:3000`에서 동작하고 MCP 엔드포인트는 `http://localhost:3000/sse` 입니다.

## ChatGPT 커넥터 연결

ChatGPT 설정 → Connectors에서 원격 MCP 서버를 추가하고 다음 URL을 입력합니다.

- `http://<서버호스트>:<포트>/sse`

이 서버는 다음 두 개의 도구를 제공합니다.

- `search(query: string, galleryId?: string, pages?: number, maxResults?: number)` → 결과: `{ id, title, text, url }[]`
- `fetch(id: string, galleryId?: string, extractImages?: boolean)` → 결과: `{ id, title, text, url, metadata }`

metadata에는 작성자/날짜/조회수/추천수/비추천수/댓글/이미지 등이 포함될 수 있습니다.

## 주의 사항

- STDIO 로그는 사용하지 않으며 HTTP 서버 로그만 사용합니다.
- 디시인사이드 이용 약관을 준수하고 과도한 요청을 피하기 위해 `REQUEST_DELAY_MS`를 적절히 설정하세요.
