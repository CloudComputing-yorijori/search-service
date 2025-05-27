const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.CLOUD_ID
  },
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
});

module.exports = client;
