// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use .env if provided, otherwise default to ../db/loan.db
const dbPath = process.env.DB_FILE || path.resolve(__dirname, '..', 'db', 'loan.db');

// Ensure the database file exists (warn if missing, but don’t crash)
if (!fs.existsSync(dbPath)) {
  console.warn("⚠️ Warning: Database file not found at", dbPath);
}

// Create and connect to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at:", dbPath);
  }
});

module.exports = db;
