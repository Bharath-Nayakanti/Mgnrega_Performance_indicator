const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '..', 'data', 'mgnrega.db');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

// Sample data for testing
const sampleData = [
  {
    district_name: 'Hyderabad',
    state_name: 'Telangana',
    fin_year: '2024-2025',
    households_worked: 12345,
    avg_wage_per_day: 275.75,
    works_completed: 67,
    women_persondays: 15000,
    total_expenditure: 12345678.90,
    total_workers: 50000,
    active_workers: 45000,
    job_cards: 48000,
    last_updated: new Date().toISOString()
  },
  {
    district_name: 'Warangal Urban',
    state_name: 'Telangana',
    fin_year: '2024-2025',
    households_worked: 8765,
    avg_wage_per_day: 260.25,
    works_completed: 52,
    women_persondays: 13500,
    total_expenditure: 10567890.12,
    total_workers: 35000,
    active_workers: 32000,
    job_cards: 34000,
    last_updated: new Date().toISOString()
  },
  {
    district_name: 'Khammam',
    state_name: 'Telangana',
    fin_year: '2024-2025',
    households_worked: 9876,
    avg_wage_per_day: 255.50,
    works_completed: 48,
    women_persondays: 12000,
    total_expenditure: 9876543.21,
    total_workers: 42000,
    active_workers: 39000,
    job_cards: 41000,
    last_updated: new Date().toISOString()
  }
];

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to SQLite database');
  
  // Create tables
  db.serialize(() => {
    // Drop existing tables if they exist
    db.run('DROP TABLE IF EXISTS districts');
    
    // Create districts table
    db.run(`
      CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_name TEXT NOT NULL,
        state_name TEXT,
        fin_year TEXT,
        households_worked INTEGER,
        avg_wage_per_day REAL,
        works_completed INTEGER,
        women_persondays INTEGER,
        total_expenditure REAL,
        total_workers INTEGER DEFAULT 0,
        active_workers INTEGER DEFAULT 0,
        job_cards INTEGER DEFAULT 0,
        last_updated TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district_name, fin_year)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating districts table:', err);
        process.exit(1);
      }
      console.log('Created districts table');
      
      // Create indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_district_name ON districts(district_name)');
      db.run('CREATE INDEX IF NOT EXISTS idx_last_updated ON districts(last_updated)');
      
      console.log('Created indexes');
      
      // Insert sample data
      const stmt = db.prepare(`
        INSERT INTO districts (
          district_name, state_name, fin_year, households_worked,
          avg_wage_per_day, works_completed, women_persondays,
          total_expenditure, total_workers, active_workers, job_cards, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      sampleData.forEach(district => {
        stmt.run(
          district.district_name,
          district.state_name,
          district.fin_year,
          district.households_worked,
          district.avg_wage_per_day,
          district.works_completed,
          district.women_persondays,
          district.total_expenditure,
          district.total_workers,
          district.active_workers,
          district.job_cards,
          district.last_updated,
          (err) => {
            if (err) {
              console.error(`Error inserting ${district.district_name}:`, err);
            } else {
              console.log(`Inserted data for ${district.district_name}`);
            }
          }
        );
      });
      
      stmt.finalize();
      
      // Verify the data was inserted
      db.all('SELECT district_name, households_worked, works_completed FROM districts', [], (err, rows) => {
        if (err) {
          console.error('Error fetching sample data:', err);
        } else {
          console.log('\nSample data in database:');
          console.table(rows);
        }
        
        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
        });
      });
    });
  });
});

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err);
  process.exit(1);
});
