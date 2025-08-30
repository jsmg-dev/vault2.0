// db.js - PostgreSQL (Render-ready)
const { Pool } = require('pg');
require('dotenv').config();

// Enable SSL by default for cloud DBs; disable for local if needed
const shouldUseSSL =
  process.env.DB_SSL?.toLowerCase() === 'true' ||
  (!process.env.DB_SSL && process.env.DB_HOST && process.env.DB_HOST !== 'localhost');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vault_db',
  password: process.env.DB_PASSWORD || 'password',
  port: Number(process.env.DB_PORT) || 5432,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

// Simple helpers
async function query(text, params) {
  return pool.query(text, params);
}
async function one(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}
async function many(text, params) {
  const res = await pool.query(text, params);
  return res.rows || [];
}

module.exports = { query, one, many, pool };
