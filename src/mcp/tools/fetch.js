// fetch.js
import { z } from 'zod';
import { createRequire } from 'node:module';
import { config as appConfig } from '../../config.js';

const require = createRequire(import.meta.url);
const dc = require('@gurumnyang/dcinside.js');


export function registerFetchTool(server) {
  server.registerTool(
    'fetch',
    {
      title: 'Fetch',
      description: 'Fetch full content for a result item by its unique ID. ',
      inputSchema: {
        id: z.string().min(1, 'id is required'),
      },
    },
    async ({ id }) => {

      // 예시: mgallery_chatgpt_12345
      // 의미: 챗지피티 마이너 갤러리 12345번 게시물
      const galleryType = id.split('_')[0]
      const galleryId = id.split('_')[1]
      const postId = id.split('_')[2]
      const withImages = true;

      try {

        //미니갤은 아직 미지원. dcinside.js 업데이트를 기다리세요
        if(['main', 'mini', 'person'].includes(galleryType)) {
          return {
            content: [{ type: 'text', text: `지원하지 않는 갤러리 타입입니다. mgallery로 시도해주세요` }],
            isError: true,
          };
        }

        const data = await dc.getPost({
          galleryId,
          postNo: postId,
          withImages,
          retryCount:1
        })

        if(data===null){
          console.log('fetch failed: post not found');
          return {
            content: [{ type: 'text', text: `fetch failed: post not found` }],
            isError: true,
          };
        }

        const result = {
            //id재사용
            id,
            title: data.title,
            text: data.text,
            metadata: {
              id,
              ...data
            }
        }


        return {content: [{
          type:"json",
          json: {results: result}
        }]};
      } catch (e) {
        return {
          content: [{ type: 'text', text: `fetch failed: ${e?.message || e}` }],
          isError: true,
        };
      }
    },
  );
}
