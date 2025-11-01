// backend/scripts/clearAndRefreshData.js
const { exec } = require('child_process');
const path = require('path');
const { getDb } = require('../db');
const { fetchAllDistricts } = require('../services/dataService');

async function clearAndRefreshData() {
  const db = getDb();
  
  try {
    console.log('Clearing existing data...');
    
    // Delete all records from the districts table
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM districts', [], function(err) {
        if (err) return reject(err);
        console.log(`Deleted ${this.changes} records from districts table`);
        resolve();
      });
    });
    
    console.log('Fetching fresh data from API...');
    
    // Fetch fresh data from the API
    const districts = await fetchAllDistricts();
    
    console.log(`Fetched ${districts.length} districts from API`);
    console.log('Data refresh completed successfully');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error refreshing data:', error);
    process.exit(1);
  }
}

clearAndRefreshData();
