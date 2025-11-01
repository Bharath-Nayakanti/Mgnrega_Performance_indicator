const { getDb } = require('../db');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
const API_KEY = '579b464db66ec23bdd000001daca76d23bf8470b46288ea5ae2c17db'; // Using the provided API key

// Enable debug logging
const DEBUG = true;

// Helper function to log debug messages
const debugLog = (...args) => {
  if (DEBUG) {
    console.log('[PopulateDB]', ...args);
  }
};

// List of Maharashtra districts
const MAHARASHTRA_DISTRICTS = [
  'AHMEDNAGAR', 'AKOLA', 'AMRAVATI', 'AURANGABAD', 'BEED', 'BHANDARA',
  'BULDANA', 'CHANDRAPUR', 'DHULE', 'GADCHIROLI', 'GONDIA', 'HINGOLI',
  'JALGAON', 'JALNA', 'KOLHAPUR', 'LATUR', 'MUMBAI', 'MUMBAI SUBURBAN',
  'NAGPUR', 'NANDED', 'NANDURBAR', 'NASHIK', 'OSMANABAD', 'PALGHAR',
  'PARBHANI', 'PUNE', 'RAIGAD', 'RATNAGIRI', 'SANGLI', 'SATARA',
  'SINDHUDURG', 'SOLAPUR', 'THANE', 'WARDHA', 'WASHIM', 'YAVATMAL'
];

// Available financial years
const FINANCIAL_YEARS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'
];

// These will be set when script is run directly
let stateName = '';
let financialYear = '';

/**
 * Fetches data from the API with the given parameters
 */
async function fetchFromApi(params = {}) {
  try {
    const defaultParams = {
      'api-key': API_KEY,
      'format': 'json',
      'limit': 1000,  // Increased limit to get more records per request
      'offset': 0
    };
    
    // Convert filters object to the format expected by the API
    const apiParams = { ...defaultParams, ...params };
    
    console.log('Making API request with params:', JSON.stringify(apiParams, null, 2));

    const response = await axios.get(API_BASE_URL, {
      params: apiParams,
      timeout: 15000,  // Increased timeout for larger responses
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MGNREGA-Tracker/1.0'
      }
    });

    debugLog('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? (response.data.records ? `${response.data.records.length} records` : 'No records in response') : 'No data'
    });

    return response.data;
  } catch (error) {
    debugLog('API Error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : 'No response',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      }
    });
    throw error;
  }
}

/**
 * Fetches data for all districts for a given year
 */
async function exploreApi() {
  debugLog('Exploring API without filters...');
  
  try {
    // First, get the API info without any filters
    const info = await fetchFromApi({
      'limit': 1
    });
    
    console.log('API Info:', JSON.stringify(info, null, 2));
    
    if (info && info.records && info.records.length > 0) {
      console.log('Sample record structure:', JSON.stringify(info.records[0], null, 2));
      
      // If we have records, try to find what fields are available
      const sampleRecord = info.records[0];
      console.log('Available fields in record:', Object.keys(sampleRecord));
      
      // Try to find state and year fields
      const possibleStateFields = ['state_name', 'state', 'stateName', 'stateNameEng'];
      const possibleYearFields = ['fin_year', 'year', 'financial_year', 'finyear'];
      
      const stateField = possibleStateFields.find(field => field in sampleRecord);
      const yearField = possibleYearFields.find(field => field in sampleRecord);
      
      console.log('Detected state field:', stateField);
      console.log('Detected year field:', yearField);
      
      return { stateField, yearField };
    }
    
    console.log('No records found in initial API call');
    return {};
  } catch (error) {
    console.error('Error exploring API:', error);
    return {};
  }
}

async function fetchStateData(stateName, year) {
  debugLog(`Fetching data for state: ${stateName}, year: ${year}`);
  
  try {
    // First, try with exact state name match
    let response = await fetchFromApi({
      'filters[state_name]': stateName.toUpperCase(),
      'filters[fin_year]': year
    });
    
    if (response && response.records && response.records.length > 0) {
      debugLog(`Found ${response.records.length} records for state: ${stateName}, year: ${year}`);
      return response.records;
    }
    
    // If no results, try with the year in different format (YYYY-YYYY)
    const [startYear] = year.split('-');
    const nextYear = (parseInt(startYear) + 1).toString();
    const alternativeYearFormat = `${startYear}-${nextYear}`;
    
    debugLog(`Trying alternative year format: ${alternativeYearFormat}`);
    response = await fetchFromApi({
      'filters[state_name]': stateName.toUpperCase(),
      'filters[fin_year]': alternativeYearFormat
    });
    
    if (response && response.records && response.records.length > 0) {
      debugLog(`Found ${response.records.length} records with alternative year format`);
      return response.records;
    }
    
    console.log(`No data found for state: ${stateName}, year: ${year} (tried formats: ${year} and ${alternativeYearFormat})`);
    return [];
    
  } catch (error) {
    console.error(`Error fetching data for state ${stateName}, year ${year}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

/**
 * Stores district data in the database
 */
async function storeDistrictData(data) {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // Map API fields to database columns
    const fieldMappings = {
      // Basic info
      'state_name': data.state_name,
      'district_name': data.district_name,
      'financial_year': data.fin_year,
      'month': data.month,
      'state_code': data.state_code,
      'district_code': data.district_code,
      
      // Key metrics
      'approved_labour_budget': data.Approved_Labour_Budget,
      'avg_wage_per_day': data.Average_Wage_rate_per_day_per_person,
      'avg_days_per_household': data.Average_days_of_employment_provided_per_Household,
      'differently_abled_workers': data.Differently_abled_persons_worked,
      'material_wages': data.Material_and_skilled_Wages,
      'works_completed': data.Number_of_Completed_Works,
      'gps_with_nil_exp': data.Number_of_GPs_with_NIL_exp,
      'ongoing_works': data.Number_of_Ongoing_Works,
      'central_liability_days': data.Persondays_of_Central_Liability_so_far,
      'sc_persondays': data.SC_persondays,
      'sc_workers': data.SC_workers_against_active_workers,
      'st_persondays': data.ST_persondays,
      'st_workers': data.ST_workers_against_active_workers,
      'admin_expenditure': data.Total_Adm_Expenditure,
      'total_expenditure': data.Total_Exp,
      'households_worked': data.Total_Households_Worked,
      'individuals_worked': data.Total_Individuals_Worked,
      'active_job_cards': data.Total_No_of_Active_Job_Cards,
      'active_workers': data.Total_No_of_Active_Workers,
      'hhs_completed_100_days': data.Total_No_of_HHs_completed_100_Days_of_Wage_Employment,
      'total_job_cards': data.Total_No_of_JobCards_issued,
      'total_workers': data.Total_No_of_Workers,
      'total_works_taken': data.Total_No_of_Works_Takenup,
      'wages': data.Wages,
      'women_persondays': data.Women_Persondays,
      'pct_category_b_works': data.percent_of_Category_B_Works,
      'pct_agri_allied_works': data.percent_of_Expenditure_on_Agriculture_Allied_Works,
      'pct_nrm_expenditure': data.percent_of_NRM_Expenditure,
      'pct_payments_within_15_days': data.percentage_payments_gererated_within_15_days,
      'remarks': data.Remarks
    };
    
    // Get column names and values
    const columns = [];
    const placeholders = [];
    const values = [];
    
    Object.entries(fieldMappings).forEach(([column, value]) => {
      if (value !== undefined) {
        columns.push(`"${column}"`);
        placeholders.push('?');
        values.push(value);
      }
    });
    
    if (columns.length === 0) {
      return reject(new Error('No valid data to insert'));
    }
    
    const sql = `
      INSERT OR REPLACE INTO district_data (
        ${columns.join(', ')}
      ) VALUES (
        ${placeholders.join(', ')}
      )
    `;
    
    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error executing SQL:', err.message);
        console.error('SQL:', sql);
        console.error('Values:', values);
        return reject(err);
      }
      debugLog(`Stored data for ${data.district_name}, ${data.fin_year}`);
      resolve();
    });
  });
}

/**
 * Main function to populate the database
 */
async function createTables() {
  const db = getDb();
  
  return new Promise((resolve, reject) => {
    // First, drop the table if it exists to ensure clean creation
    const dropTableSql = `DROP TABLE IF EXISTS district_data`;
    
    db.run(dropTableSql, [], function(err) {
      if (err) {
        console.error('Error dropping table:', err.message);
        return reject(err);
      }
      
      console.log('Dropped existing table (if any)');
      
      // Now create the table with the correct schema
      const createTableSql = `
        CREATE TABLE district_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          state_name TEXT NOT NULL,
          district_name TEXT NOT NULL,
          financial_year TEXT NOT NULL,
          month TEXT,
          state_code TEXT,
          district_code TEXT,
          approved_labour_budget REAL,
          avg_wage_per_day REAL,
          avg_days_per_household REAL,
          differently_abled_workers INTEGER,
          material_wages REAL,
          works_completed INTEGER,
          gps_with_nil_exp INTEGER,
          ongoing_works INTEGER,
          central_liability_days INTEGER,
          sc_persondays INTEGER,
          sc_workers INTEGER,
          st_persondays INTEGER,
          st_workers INTEGER,
          admin_expenditure REAL,
          total_expenditure REAL,
          households_worked INTEGER,
          individuals_worked INTEGER,
          active_job_cards INTEGER,
          active_workers INTEGER,
          hhs_completed_100_days INTEGER,
          total_job_cards INTEGER,
          total_workers INTEGER,
          total_works_taken INTEGER,
          wages REAL,
          women_persondays INTEGER,
          pct_category_b_works REAL,
          pct_agri_allied_works REAL,
          pct_nrm_expenditure REAL,
          pct_payments_within_15_days REAL,
          remarks TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(state_name, district_name, financial_year, month) ON CONFLICT REPLACE
        )
      `;
      
      db.run(createTableSql, [], function(err) {
        if (err) {
          console.error('Error creating table:', err.message);
          console.error('SQL:', createTableSql);
          return reject(err);
        }
        console.log('Successfully created district_data table');
        
        // Verify the table was created
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='district_data'", [], (err, tables) => {
          if (err) {
            console.error('Error verifying table creation:', err.message);
            return reject(err);
          }
          
          if (tables && tables.length > 0) {
            console.log('Table verification successful');
            resolve();
          } else {
            reject(new Error('Table creation verification failed'));
          }
        });
      });
    });
  });
}

async function populateDatabase() {
  console.log('Starting database population...');
  
  try {
    // Ensure tables exist
    await createTables();
    let totalStored = 0;
    
    // Define the financial years to fetch (2020-21 to 2024-25)
    const financialYears = [
      '2020-21',
      '2021-22',
      '2022-23',
      '2023-24',
      '2024-25'
    ];
    
    for (const financialYear of financialYears) {
      console.log(`\nFetching data for ${stateName}, FY: ${financialYear}...`);
      
      // Fetch data for the specified state and year
      const stateData = await fetchStateData(stateName, financialYear);
      
      if (!stateData || stateData.length === 0) {
        console.log(`No data found for state: ${stateName}, year: ${financialYear}`);
        continue;
      }
      
      // Store all records for the state and year in the database
      try {
        let yearStored = 0;
        for (const record of stateData) {
          await storeDistrictData(record);
          totalStored++;
          yearStored++;
          if (totalStored % 10 === 0) {
            process.stdout.write('.');
          }
        }
        console.log(`\nStored ${yearStored} records for FY ${financialYear}`);
      } catch (err) {
        console.error(`\nError storing records for FY ${financialYear}:`, err.message);
        // Continue with next year even if one year fails
        continue;
      }
    }
    
    console.log('\n\nDatabase population completed successfully!');
    console.log(`Total records stored across all years: ${totalStored}`);
  } catch (error) {
    console.error('Error in populateDatabase:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    const db = getDb();
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database connection:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Export functions for use in server.js
module.exports = {
  fetchStateData,
  storeDistrictData,
  populateDatabase
};

// Run the population script only if this file is executed directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--state' && args[i + 1]) {
      stateName = args[++i];
    } else if (args[i] === '--year' && args[i + 1]) {
      financialYear = args[++i];
    }
  }

  // Validate required parameters
  if (!stateName || !financialYear) {
    console.error('Error: Both --state and --year parameters are required');
    console.log('Usage: node scripts/populateDatabase.js --state "STATE_NAME" --year "YYYY-YY"');
    console.log('Example: node scripts/populateDatabase.js --state "MAHARASHTRA" --year "2023-24"');
    process.exit(1);
  }

  console.log(`Fetching data for State: ${stateName}, Year: ${financialYear}`);
  populateDatabase();
}
