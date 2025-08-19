// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Define absolute path for the SQLite database file
const dbPath = path.resolve(__dirname, 'loan.db');

// Ensure the database file exists (optional safety check)
if (!fs.existsSync(dbPath)) {
  console.warn("⚠️ Warning: Database file 'loan.db' not found at", dbPath);
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
