require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
console.log("Cloud ID 확인:", process.env.CLOUD_ID);


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
