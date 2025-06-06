// require('dotenv').config(); // .env 파일 로드

// const express = require('express');
// const app = express();
// const searchRoutes = require('./routes/search');

// app.use(express.json());
// app.use('/search', searchRoutes);

// const PORT = process.env.PORT || 3001; // GCP 환경 대응
// app.listen(PORT, () => {
//   console.log(`Search service running on port ${PORT}`);
// });


const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout'); // views/layout.ejs 또는 views/layout/layout.ejs로 인식


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // static assets
app.use(cookieParser()); // 로그인 여부 판단할 경우 필요

const searchRoutes = require('./routes/search');
app.use('/', searchRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Search service running on port ${PORT}`);
});
