const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'dev-komiknesia_nusakomik',
  password: '@Nusakomik123',
  database: 'dev-komiknesia_nusakomik',
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 100,
  connectTimeout: 10000,
};

const db = mysql.createPool(dbConfig);

module.exports = db;

