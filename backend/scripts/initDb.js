const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to SQLite database
const db = new sqlite3.Database(path.join(dataDir, 'mgnrega.db'));

// Initialize database schema
db.serialize(() => {
  // Create districts table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_name TEXT NOT NULL,
      state_name TEXT NOT NULL,
      fin_year TEXT NOT NULL,
      households_worked INTEGER,
      avg_wage_per_day REAL,
      works_completed INTEGER,
      women_persondays INTEGER,
      total_expenditure REAL,
      is_sample_data INTEGER DEFAULT 0,
      last_updated TEXT,
      UNIQUE(district_name, fin_year)
    )
  `);

  console.log('Database schema initialized');

  // Sample data for 2022-2023
  const sampleData = [
    {
      district_name: 'Mumbai',
      state_name: 'MAHARASHTRA',
      fin_year: '2022-2023',
      households_worked: 120000,
      avg_wage_per_day: 350,
      works_completed: 1200,
      women_persondays: 90000,
      total_expenditure: 250000000,
      is_sample_data: 1,
      last_updated: new Date().toISOString()
    },
    {
      district_name: 'Pune',
      state_name: 'MAHARASHTRA',
      fin_year: '2022-2023',
      households_worked: 95000,
      avg_wage_per_day: 300,
      works_completed: 1100,
      women_persondays: 75000,
      total_expenditure: 200000000,
      is_sample_data: 1,
      last_updated: new Date().toISOString()
    },
    {
      district_name: 'Nagpur',
      state_name: 'MAHARASHTRA',
      fin_year: '2022-2023',
      households_worked: 85000,
      avg_wage_per_day: 280,
      works_completed: 950,
      women_persondays: 65000,
      total_expenditure: 180000000,
      is_sample_data: 1,
      last_updated: new Date().toISOString()
    }
  ];

  // Insert sample data
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO districts (
      district_name, state_name, fin_year, households_worked, 
      avg_wage_per_day, works_completed, women_persondays, 
      total_expenditure, is_sample_data, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      district.is_sample_data,
      district.last_updated
    );
  });

  stmt.finalize();
  console.log('Sample data inserted');

  // Verify data was inserted
  db.all('SELECT * FROM districts', (err, rows) => {
    if (err) {
      console.error('Error fetching data:', err);
    } else {
      console.log('Current data in database:');
      console.table(rows);
    }
    
    // Close the database connection
    db.close();
  });
});
