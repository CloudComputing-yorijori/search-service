const express = require('express');
const router = express.Router();
const client = require('../services/elastic');

router.get('/', async (req, res) => {
  const { q } = req.query;
  const result = await client.search({
    index: 'your-index-name',
    query: {
      multi_match: {
        query: q,
        fields: ['title^2', 'content']
      }
    }
  });
  res.json(result.hits.hits);
});

module.exports = router;
