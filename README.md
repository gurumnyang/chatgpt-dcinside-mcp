# dcinside-mcp

ChatGPT MCP Connecter 사용으로 dcinside 크롤링을 지원하는 MCP 서버입니다.

## 요구 사항

- Node.js

## 설치

프로젝트 루트에서 의존성 설치 후 `.env`를 준비하세요.

```bash
npm install
cp .env.example .env
```

`.env`에서 기본 갤러리 ID 등을 설정합니다.

## 환경 변수

- `PORT` (기본 3000)
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

주의: ChatGPT 공홈은 http를 미지원할 수 있습니다. https 환경과 도메인 세팅이 선행됩니다.
