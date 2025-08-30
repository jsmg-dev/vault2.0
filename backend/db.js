// db.js - PostgreSQL Configuration
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vault_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("❌ Failed to connect to PostgreSQL database:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL database");
  }
});

// Create a db object that mimics SQLite3 interface for compatibility
const db = {
  // Mimic SQLite3 methods
  run: (sql, params = [], callback) => {
    if (callback) {
      pool.query(sql, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          // For INSERT operations, get the last inserted ID
          if (sql.trim().toUpperCase().startsWith('INSERT')) {
            pool.query('SELECT LASTVAL()', (err2, result2) => {
              if (err2) {
                callback(err2);
              } else {
                callback(null, { lastID: result2.rows[0].lastval });
              }
            });
          } else {
            callback(null, { lastID: result.rows[0]?.id || result.insertId });
          }
        }
      });
    } else {
      return pool.query(sql, params);
    }
  },

  get: (sql, params = [], callback) => {
    if (callback) {
      pool.query(sql, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0] || null);
        }
      });
    } else {
      return pool.query(sql, params);
    }
  },

  all: (sql, params = [], callback) => {
    if (callback) {
      pool.query(sql, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows || []);
        }
      });
    } else {
      return pool.query(sql, params);
    }
  },

  serialize: (callback) => {
    // PostgreSQL handles transactions differently, but we can still execute sequentially
    if (callback) callback();
  },

  // Close connection
  close: () => {
    pool.end();
  }
};

module.exports = db;
