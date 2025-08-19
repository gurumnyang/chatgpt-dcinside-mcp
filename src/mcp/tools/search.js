// search.js
// - 목적: MCP 도구 스펙에 맞춘 'search' 도구를 등록합니다.
// - 입력: { query: string } (검색어)
// - 출력: 검색 결과 목록 [{ id, title, text, url }, ...]를 JSON으로 반환합니다.
import { z } from 'zod';
import { createRequire } from 'node:module';
import { config as appConfig } from '../../config.js';

// CommonJS 모듈을 ESM 환경에서 사용하기 위한 require 생성
const require = createRequire(import.meta.url);
const dc = require('@gurumnyang/dcinside.js');

// makeSnippet
// - 큰 본문에서 검색어 주변을 발췌하여 길이 제한(maxLen) 내의 요약(snippet)을 만듭니다.
// - 검색어가 없으면 단순히 앞부분을 잘라 반환합니다.
function makeSnippet(text, query, maxLen = 200) {
  try {
    if (!text) return '';
    const idx = query ? text.toLowerCase().indexOf(String(query).toLowerCase()) : -1;
    if (idx === -1) return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
    const start = Math.max(0, idx - Math.floor(maxLen / 2));
    const end = Math.min(text.length, start + maxLen);
    const snippet = text.slice(start, end);
    return `${start > 0 ? '...' : ''}${snippet}${end < text.length ? '...' : ''}`;
  } catch {
    return '';
  }
}

// registerSearchTool(server)
// - server에 'search' 도구를 등록합니다.
// - 내부 동작: 설정값(appConfig)에 따라 최근 게시물 목록을 페이지 단위로 조회하고,
//   각 게시물 제목에 검색어가 포함되는지를 체크한 뒤 관련 게시물만 결과로 수집합니다.
// - 이후 각 후보 게시물에 대해 상세 내용을 가져와 snippet을 생성하고 최종 결과로 반환합니다.
export function registerSearchTool(server) {
  server.registerTool(
    'search',
    {
      title: 'Search',
      description: 'Return potentially relevant results for a query string from the exposed dataset.',
      inputSchema: {
        query: z.string().min(1, 'query is required')
      },
    },
    async ({ query }) => {
      try {
        let result_latest = (await dc.search(query, { sort: 'latest' })).posts;
        let result_accuracy = (await dc.search(query, { sort: 'accuracy' })).posts;
        
        result_latest = result_latest.map(item => ({
          ...item,
          content: item.content.length > 200 ? `${item.content.slice(0, 200)}...` : item.content
        }));
        result_accuracy = result_accuracy.map(item => ({
          ...item,
          content: item.content.length > 200 ? `${item.content.slice(0, 200)}...` : item.content
        }));

        let results = [...result_latest, ...result_accuracy].map(item => ({
          id: `${item.galleryType}_${item.galleryId}_${item.link.match(/no=(\d+)/)?.[1]}`,
          title: item.title,
          text: (`date: ${item.date} / 출처: ${item.galleryName}`),
          url: item.link
        }));

        return {content: [{
          type:"text",
          text: JSON.stringify({results: results})
        }]};

      } catch (err) {
        console.log(err);
        return { content: [{ type: 'text', text: `검색 중 오류가 발생했습니다: ${err.message}` }] };
      }
    },
  );
}
