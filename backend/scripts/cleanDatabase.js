const { getDb } = require('../db');

async function cleanDatabase() {
  console.log('Starting database cleanup...');
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Delete all records from the districts table
    db.run('DELETE FROM districts', [], function(err) {
      if (err) {
        console.error('Error cleaning database:', err);
        return reject(err);
      }
      
      console.log(`Successfully cleaned database. Removed ${this.changes} records.`);
      db.close();
      resolve();
    });
  });
}

// Run the cleanup script
cleanDatabase()
  .then(() => {
    console.log('Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  });
