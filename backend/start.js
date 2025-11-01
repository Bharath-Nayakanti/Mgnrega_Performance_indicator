// start.js - Ensures database is ready before starting server
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data/mgnrega.db');

// Check if database exists and has data
async function checkDatabase() {
  return new Promise((resolve, reject) => {
    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.log('Database file does not exist');
      return resolve(false);
    }

    // Check if database has data
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return resolve(false);
      }

      db.get('SELECT COUNT(*) as count FROM district_data', [], (err, row) => {
        db.close();
        
        if (err) {
          console.error('Error querying database:', err);
          return resolve(false);
        }

        const hasData = row && row.count > 0;
        console.log(`Database has ${row ? row.count : 0} records`);
        resolve(hasData);
      });
    });
  });
}

// Populate database
async function populateDatabase() {
  return new Promise((resolve, reject) => {
    console.log('\n=== Populating database with Maharashtra data ===\n');
    
    // Use the full path to the script
    const scriptPath = path.join(__dirname, 'scripts', 'populateDatabase.js');
    
    const populate = spawn('node', [
      scriptPath,
      '--state', 'MAHARASHTRA',
      '--year', '2023-24'
    ], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true  // Use shell for better path resolution
    });

    populate.on('close', (code) => {
      if (code === 0) {
        console.log('\n=== Database population completed ===\n');
        resolve();
      } else {
        console.error(`\nDatabase population failed with code ${code}\n`);
        // Continue with server start even if population fails
        console.log('Continuing with server start...');
        resolve();
      }
    });

    populate.on('error', (err) => {
      console.error('Error running population script:', err);
      // Continue with server start even if population fails
      console.log('Continuing with server start despite population error...');
      resolve();
    });
  });
}

// Start server
function startServer() {
  console.log('\n=== Starting server ===\n');
  
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  server.on('error', (err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });

  // Forward signals to child process
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  process.on('SIGINT', () => server.kill('SIGINT'));
}

// Main function
async function main() {
  try {
    console.log('Checking database status...');
    const hasData = await checkDatabase();

    if (!hasData) {
      console.log('Database is empty or does not exist. Populating with initial data...');
      await populateDatabase();
    } else {
      console.log('Database already has data. Skipping population.');
    }

    startServer();
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

// Run main function
main();
