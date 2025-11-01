// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { startScheduler, checkAndInitialUpdate, getUpdateStatus, triggerManualUpdate } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const DB_PATH = path.join(__dirname, 'data/mgnrega.db');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/districts', (req, res) => {
    const { state, year } = req.query;
    let query = 'SELECT DISTINCT district_name FROM district_data WHERE 1=1';
    const params = [];

    if (state) {
        query += ' AND state_name = ?';
        params.push(state);
    }
    if (year) {
        query += ' AND financial_year = ?';
        params.push(year);
    }
    query += ' ORDER BY district_name';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching districts:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows.map(row => row.district_name));
    });
});

// Get specific district data
app.get('/api/district/:district', async (req, res) => {
    const { district } = req.params;
    const { year } = req.query;
    
    console.log(`[API] Fetching data for district: ${district}, year: ${year}`);
    
    try {
        // First, try to get data from database
        const data = await getDataFromDatabase(null, district, year);
        
        if (data && data.length > 0) {
            console.log(`[API] Found ${data.length} records in database`);
            // Return the first record (most recent month)
            return res.json(data[0]);
        }
        
        // If no data in database, try to fetch from API
        console.log(`[API] No data in database, fetching from external API...`);
        const apiData = await fetchFromAPI(null, district, year);
        
        if (apiData && apiData.length > 0) {
            console.log(`[API] Fetched ${apiData.length} records from external API`);
            return res.json(apiData[0]);
        }
        
        // No data available
        console.log(`[API] No data available for ${district}, year ${year}`);
        return res.status(404).json({ 
            error: 'No data available',
            message: `No data found for district ${district} in year ${year}`,
            district_name: district,
            fin_year: year
        });
    } catch (error) {
        console.error('[API] Error fetching district data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data',
            details: error.message 
        });
    }
});

// Get data with API fallback
app.get('/api/data', (req, res) => {
    const { state, district, year } = req.query;
    
    // First try to get data from database
    getDataFromDatabase(state, district, year)
        .then(data => {
            if (data && data.length > 0) {
                return res.json(data);
            }
            // If no data in database, try to fetch from API
            return fetchFromAPI(state, district, year)
                .then(apiData => {
                    res.json(apiData);
                });
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch data',
                details: error.message 
            });
        });
});

// Scheduler status endpoint
app.get('/api/scheduler/status', (req, res) => {
    const status = getUpdateStatus();
    res.json(status);
});

// Manual update trigger endpoint (for admin use)
app.post('/api/scheduler/update', async (req, res) => {
    try {
        // Trigger update in background
        triggerManualUpdate().catch(err => {
            console.error('Background update error:', err);
        });
        res.json({ 
            message: 'Data update triggered successfully',
            status: 'running'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to trigger update',
            details: error.message 
        });
    }
});

// Helper function to normalize year format
function normalizeYear(year) {
    if (!year) return null;
    
    // If already in YYYY-YYYY format, return as is
    if (/^\d{4}-\d{4}$/.test(year)) {
        return year;
    }
    
    // Convert YYYY-YY to YYYY-YYYY
    const match = year.match(/^(\d{4})-(\d{2})$/);
    if (match) {
        const startYear = match[1];
        const endYear = `20${match[2]}`; // Assuming 21st century
        return `${startYear}-${endYear}`;
    }
    
    return year;
}

// Helper function to get data from database
function getDataFromDatabase(state, district, year) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM district_data WHERE 1=1';
        const params = [];

        if (state) {
            query += ' AND UPPER(state_name) = UPPER(?)';
            params.push(state);
        }
        if (district) {
            query += ' AND UPPER(district_name) = UPPER(?)';
            params.push(district);
        }
        if (year) {
            // Normalize year format to match database
            const normalizedYear = normalizeYear(year);
            query += ' AND financial_year = ?';
            params.push(normalizedYear);
        }
        
        // Order by month descending to get most recent data first
        query += ' ORDER BY month DESC';

        console.log('[DB Query]', query, params);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('[DB Error]', err);
                return reject(err);
            }
            console.log(`[DB Result] Found ${rows ? rows.length : 0} records`);
            resolve(rows || []);
        });
    });
}

// Helper function to fetch data from API
async function fetchFromAPI(state, district, year) {
    // Import the fetch function from populateDatabase
    const { fetchStateData, storeDistrictData } = require('./scripts/populateDatabase');
    
    try {
        // Default to MAHARASHTRA if no state is specified
        const stateName = state || 'MAHARASHTRA';
        console.log(`Fetching data from API for state: ${stateName}, year: ${year}...`);
        const apiData = await fetchStateData(stateName, year);
        
        if (!apiData || apiData.length === 0) {
            return [];
        }

        // Store the fetched data in database
        const storedData = [];
        for (const item of apiData) {
            // Only include the requested district if specified
            if (!district || item.district_name.toUpperCase() === district.toUpperCase()) {
                try {
                    await storeDistrictData(item);
                    storedData.push(item); // Return the original API data
                } catch (storeError) {
                    console.error(`Error storing data for ${item.district_name}:`, storeError.message);
                    // Continue with other records even if one fails
                }
            }
        }

        return storedData;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Failed to fetch data from API');
    }
}

// ... (keep all the existing code until the static file serving part)

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle all other routes by serving the React app's index.html
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'), err => {
        if (err) {
            // If the file doesn't exist, it means the frontend hasn't been built yet
            if (err.code === 'ENOENT') {
                res.status(404).send(`
                    <h1>Frontend not built</h1>
                    <p>Please build the frontend first by running:</p>
                    <pre>cd ../frontend && npm run build</pre>
                `);
            } else {
                next(err);
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    
    // Initialize scheduler
    console.log('\nInitializing data update scheduler...');
    startScheduler();
    
    // Check if data needs initial update
    await checkAndInitialUpdate();
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    db.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    db.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});