// scheduler.js - Auto-update data from government API
require('dotenv').config();
const cron = require('node-cron');
const { getDb } = require('./db');
const { fetchStateData, storeDistrictData } = require('./scripts/populateDatabase');

const STATE_NAME = 'MAHARASHTRA';
const FINANCIAL_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];

// Track last update time
let lastUpdateTime = null;
let isUpdating = false;

/**
 * Update data for all years
 */
async function updateAllData() {
  if (isUpdating) {
    console.log('[Scheduler] Update already in progress, skipping...');
    return;
  }

  isUpdating = true;
  console.log('\n=== Starting Scheduled Data Update ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    let totalUpdated = 0;
    
    for (const year of FINANCIAL_YEARS) {
      console.log(`\n[Scheduler] Fetching data for ${STATE_NAME}, FY: ${year}`);
      
      try {
        // Fetch data from government API
        const stateData = await fetchStateData(STATE_NAME, year);
        
        if (!stateData || stateData.length === 0) {
          console.log(`[Scheduler] No data available for ${year}`);
          continue;
        }
        
        console.log(`[Scheduler] Found ${stateData.length} records for ${year}`);
        
        // Update database with new data
        for (const record of stateData) {
          try {
            await storeDistrictData(record);
            totalUpdated++;
            
            // Log progress every 50 records
            if (totalUpdated % 50 === 0) {
              console.log(`[Scheduler] Updated ${totalUpdated} records...`);
            }
          } catch (err) {
            console.error(`[Scheduler] Error storing record for ${record.district_name}:`, err.message);
          }
        }
        
        console.log(`[Scheduler] Completed update for ${year}: ${stateData.length} records`);
        
      } catch (err) {
        console.error(`[Scheduler] Error fetching data for ${year}:`, err.message);
        continue; // Continue with next year even if one fails
      }
    }
    
    lastUpdateTime = new Date();
    console.log(`\n=== Data Update Completed ===`);
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`Last update: ${lastUpdateTime.toISOString()}\n`);
    
  } catch (error) {
    console.error('[Scheduler] Error during data update:', error.message);
  } finally {
    isUpdating = false;
  }
}

/**
 * Get last update information
 */
function getUpdateStatus() {
  return {
    lastUpdate: lastUpdateTime,
    isUpdating: isUpdating,
    nextUpdate: getNextScheduledTime()
  };
}

/**
 * Calculate next scheduled update time
 */
function getNextScheduledTime() {
  const now = new Date();
  const next = new Date();
  
  // Schedule is at 2 AM daily
  next.setHours(2, 0, 0, 0);
  
  // If it's past 2 AM today, schedule for tomorrow
  if (now.getHours() >= 2) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Start the scheduler
 */
function startScheduler() {
  console.log('\n=== Data Update Scheduler Started ===');
  console.log('Schedule: Daily at 2:00 AM');
  console.log(`Next update: ${getNextScheduledTime().toISOString()}`);
  console.log('=====================================\n');
  
  // Schedule daily updates at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('\n[Scheduler] Triggered scheduled update at 2:00 AM');
    await updateAllData();
  }, {
    timezone: "Asia/Kolkata" // Indian Standard Time
  });
  
  // Also schedule a weekly full refresh on Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('\n[Scheduler] Triggered weekly full refresh');
    await updateAllData();
  }, {
    timezone: "Asia/Kolkata"
  });
}

/**
 * Manual update trigger (for testing or immediate updates)
 */
async function triggerManualUpdate() {
  console.log('[Scheduler] Manual update triggered');
  await updateAllData();
}

// Check if database needs initial update
async function checkAndInitialUpdate() {
  const db = getDb();
  
  return new Promise((resolve) => {
    db.get(
      'SELECT MAX(updated_at) as last_update FROM district_data',
      [],
      async (err, row) => {
        if (err) {
          console.error('[Scheduler] Error checking last update:', err);
          resolve();
          return;
        }
        
        if (!row || !row.last_update) {
          console.log('[Scheduler] No recent updates found in database');
          resolve();
          return;
        }
        
        const lastUpdate = new Date(row.last_update);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        console.log(`[Scheduler] Last database update: ${lastUpdate.toISOString()}`);
        console.log(`[Scheduler] Hours since last update: ${hoursSinceUpdate.toFixed(1)}`);
        
        // If data is older than 24 hours, trigger an update
        if (hoursSinceUpdate > 24) {
          console.log('[Scheduler] Data is stale (>24 hours), triggering update...');
          await updateAllData();
        } else {
          console.log('[Scheduler] Data is fresh, no immediate update needed');
        }
        
        resolve();
      }
    );
  });
}

module.exports = {
  startScheduler,
  triggerManualUpdate,
  getUpdateStatus,
  checkAndInitialUpdate
};
