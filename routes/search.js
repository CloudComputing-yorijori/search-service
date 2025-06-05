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

// 스크랩 기반 추천 API (직접 통신 방식)
router.get('/recommend/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. scrap-service에서 스크랩한 postId 목록 가져오기
    const scrapResponse = await axios.get(`http://community-service:8081/api/saves/${userId}`);
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
    console.error(' Recommend error:', error);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});


// 게시글 인덱싱 (등록/업데이트)
router.post('/index', async (req, res) => {
  const { postId, title, content } = req.body;

  if (!postId || !title || !content) {
    return res.status(400).json({ error: 'postId, title, content가 모두 필요합니다.' });
  }

  try {
    const result = await client.index({
      index: 'posts',
      id: postId, // 고유 ID로 설정 (수정 가능하게 하기 위해)
      document: { title, content }
    });

    res.status(201).json({ message: ' 게시글 인덱싱 완료', result });
  } catch (error) {
    console.error('Indexing error:', error.message);
    res.status(500).json({ error: 'Indexing failed' });
  }
});

// 게시글 수정
router.put('/index/:postId', async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title과 content가 필요합니다.' });
  }

  try {
    const result = await client.update({
      index: 'posts',
      id: postId,
      doc: { title, content }
    });

    res.json({ message: '게시글 수정 완료', result });
  } catch (error) {
    console.error(' Update error:', error.message);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 게시글 삭제
router.delete('/index/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await client.delete({
      index: 'posts',
      id: postId
    });

    res.json({ message: '게시글 삭제 완료', result });
  } catch (error) {
    console.error('Delete error:', error.meta?.body?.result || error.message);
    res.status(500).json({ error: 'Delete failed' });
  }
});
