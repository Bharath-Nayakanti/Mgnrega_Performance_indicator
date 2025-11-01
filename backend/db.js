const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getDb() {
  if (dbInstance) return dbInstance;

  const dataDir = ensureDataDir();
  const DB_PATH = path.join(dataDir, 'mgnrega.db');

  dbInstance = new sqlite3.Database(
    DB_PATH,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
      } else {
        console.log('Connected to SQLite database at', DB_PATH);
      }
    }
  );

  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
    dbInstance = null;
  }
}

module.exports = { getDb, closeDb };
