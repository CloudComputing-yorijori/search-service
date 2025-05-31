const express = require('express');
const app = express();
const searchRoutes = require('./routes/search'); // ✅ 한 번만 선언

app.use(express.json());
app.use('/search', searchRoutes);

app.listen(3001, () => {
  console.log('Search service running on port 3001');
});

