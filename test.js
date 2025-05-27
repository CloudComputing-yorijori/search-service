const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: { id: process.env.CLOUD_ID },
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
});

async function testConnection() {
  try {
    const info = await client.info();
    console.log('연결 성공:', info);
  } catch (err) {
    console.error('연결 실패:', err.message);
  }
}

testConnection();

async function ensureIndexExists(indexName) {
  const exists = await client.indices.exists({ index: indexName });
  if (!exists) {
    await client.indices.create({ index: indexName });
    console.log(`인덱스 ${indexName} 생성됨`);
  }
}

async function indexDocument() {
  const indexName = 'my-index';
  await ensureIndexExists(indexName);

  const response = await client.index({
    index: indexName,
    document: {
      title: '요리조리 검색 예제',
      content: '엘라스틱서치에서 문서를 검색할 수 있습니다.',
      createdAt: new Date().toISOString()
    }
  });

  console.log('문서 저장됨:', response);
}

async function searchDocuments(keyword) {
  const indexName = 'my-index';
  await ensureIndexExists(indexName);

  const result = await client.search({
    index: indexName,
    query: {
      multi_match: {
        query: keyword,
        fields: ['title', 'content']
      }
    }
  });

  console.log('검색 결과:', result.hits.hits);
}

(async () => {
  await indexDocument(); // 문서 저장
  await searchDocuments('검색'); // 검색 실행
})();

