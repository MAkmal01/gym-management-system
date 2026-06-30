// config/db.js — MySQL connection pool

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: false },   // Required for Aiven MySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection on startup (non-fatal — important for serverless environments like Vercel)
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    // Do NOT exit here — on Vercel this would crash the serverless function silently.
    // Let actual queries fail with a proper error response instead.
  });

module.exports = pool;