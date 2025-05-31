const client = require('../services/elastic');
require('dotenv').config();

const posts = [
  {
    title: '김치찌개 맛집',
    content: '서울에서 가장 맛있는 김치찌개를 소개합니다.'
  },
  {
    title: '김치볶음밥 레시피',
    content: '김치와 밥을 참기름으로 볶으면 완성!'
  },
  {
    title: '맛있는 김치 보관법',
    content: '김치를 오래 보관하려면 용기와 온도가 중요해요.'
  },
   {
    title: '김치볶음밥 황금 레시피',
    content: '김치와 햄, 계란으로 만드는 초간단 볶음밥!'
  },
  {
    title: '김치찌개 맛있게 끓이기',
    content: '돼지고기와 김치를 오래 끓이면 깊은 맛이 나요.'
  },
  {
    title: '김치전 만들기 꿀팁',
    content: '부침가루와 김치 비율이 중요해요.'
  },
  {
    title: '돼지고기 김치찜 레시피',
    content: '묵은지와 목살을 함께 넣고 푹 끓이기'
  },
  {
    title: '김치 없이 못사는 나',
    content: '매 끼니 빠질 수 없는 김치! 김치만 있으면 밥 한 그릇 뚝딱!'
  },
  {
    title: '된장찌개보다 김치찌개',
    content: '나는 김치찌개파다. 이유는 묻지 마세요.'
  },
  {
    title: '계란말이보단 김치볶음밥',
    content: '매콤한 김치볶음밥에 계란후라이 올려 먹기 최고!'
  },
  {
    title: '김치와 어울리는 반찬 추천',
    content: '계란찜, 멸치볶음, 김치, 그리고 간장계란밥'
  }
];

async function resetIndex() {
  const exists = await client.indices.exists({ index: 'posts' });
  if (exists) {
    await client.indices.delete({ index: 'posts' });
    console.log('❌ 기존 posts 인덱스 삭제 완료');
  }

  await client.indices.create({
    index: 'posts',
    mappings: {
      properties: {
        title: { type: 'text', analyzer: 'standard' },
        content: { type: 'text', analyzer: 'standard' }
      }
    }
  });

  console.log('✅ posts 인덱스 생성 및 매핑 완료');
}

async function insertDocs() {
  for (const post of posts) {
    const res = await client.index({
      index: 'posts',
      document: post
    });
    console.log('📌 문서 삽입 완료:', res.result);
  }
}

async function run() {
  await resetIndex();
  await insertDocs();
}

run();

