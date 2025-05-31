const express = require('express');
const axios = require('axios');
const router = express.Router();
const client = require('../services/elastic');

// 기존 검색 API
router.get('/', async (req, res) => {
  const { q } = req.query;
  const result = await client.search({
    index: 'posts',
    query: {
      multi_match: {
        query: q,
        fields: ['title^2', 'content']
      }
    }
  });
  res.json(result.hits.hits);
});

// 자동완성 API
router.get('/autocomplete', async (req, res) => {
  const { q } = req.query;
  try {
    const result = await client.search({
      index: 'posts',
      size: 5,
      query: {
        match_phrase_prefix: {
          title: q
        }
      },
      _source: ['title']
    });

    const suggestions = result.hits.hits.map(hit => hit._source.title);
    res.json(suggestions);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// ✅ 스크랩 기반 추천 API (직접 통신 방식)
router.get('/recommend/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. scrap-service에서 스크랩한 postId 목록 가져오기
    const scrapResponse = await axios.get(`http://localhost:3003/scrap/${userId}`);
    const scrapedPostIds = scrapResponse.data.map(post => post.postId);

    if (!scrapedPostIds || scrapedPostIds.length === 0) {
      return res.status(400).json({ error: 'No scraped posts found' });
    }

    // 2. Elasticsearch에 추천 쿼리 요청
    const result = await client.search({
      index: 'posts',
      size: 10,
      query: {
        more_like_this: {
          fields: ['content'],
          like: scrapedPostIds.map(id => ({ _id: id })),
          min_term_freq: 1,
          max_query_terms: 12
        }
      }
    });

    res.json(result.hits.hits);
  } catch (error) {
    console.error('❌ Recommend error:', error);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

// 🔍 전체 문서 조회 (디버깅용)
router.get('/all', async (req, res) => {
  try {
    const result = await client.search({
      index: 'posts',
      query: { match_all: {} },
      size: 100
    });
    res.json(result.hits.hits);
  } catch (error) {
    console.error('❌ 전체 문서 조회 오류:', error.meta?.body || error);
    res.status(500).json({ error: '전체 조회 실패' });
  }
});

module.exports = router;

