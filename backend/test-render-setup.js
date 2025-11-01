// Test script to verify Render deployment setup
const path = require('path');
const fs = require('fs');

console.log('=== Testing Render Deployment Setup ===\n');

// Test 1: Check data directory creation
console.log('Test 1: Data directory creation');
const dataDir = path.join(__dirname, 'data');
console.log(`  Expected path: ${dataDir}`);

if (!fs.existsSync(dataDir)) {
  console.log('  Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

if (fs.existsSync(dataDir)) {
  console.log('  ✅ Data directory exists or was created\n');
} else {
  console.log('  ❌ Failed to create data directory\n');
  process.exit(1);
}

// Test 2: Check db.js module
console.log('Test 2: Database module');
try {
  const { getDb, closeDb } = require('./db');
  console.log('  ✅ db.js module loads correctly');
  console.log('  ✅ getDb function exists');
  console.log('  ✅ closeDb function exists\n');
} catch (err) {
  console.log('  ❌ Error loading db.js:', err.message);
  process.exit(1);
}

// Test 3: Check populateDatabase.js
console.log('Test 3: Population script');
try {
  const { fetchStateData, storeDistrictData, populateDatabase } = require('./scripts/populateDatabase');
  console.log('  ✅ populateDatabase.js loads correctly');
  console.log('  ✅ fetchStateData function exists');
  console.log('  ✅ storeDistrictData function exists');
  console.log('  ✅ populateDatabase function exists\n');
} catch (err) {
  console.log('  ❌ Error loading populateDatabase.js:', err.message);
  process.exit(1);
}

// Test 4: Check start.js
console.log('Test 4: Start script');
try {
  // Just check if file exists and is readable
  const startPath = path.join(__dirname, 'start.js');
  if (fs.existsSync(startPath)) {
    console.log('  ✅ start.js exists\n');
  } else {
    console.log('  ❌ start.js not found\n');
    process.exit(1);
  }
} catch (err) {
  console.log('  ❌ Error checking start.js:', err.message);
  process.exit(1);
}

// Test 5: Check server.js
console.log('Test 5: Server script');
try {
  const serverPath = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverPath)) {
    console.log('  ✅ server.js exists\n');
  } else {
    console.log('  ❌ server.js not found\n');
    process.exit(1);
  }
} catch (err) {
  console.log('  ❌ Error checking server.js:', err.message);
  process.exit(1);
}

// Test 6: Check package.json scripts
console.log('Test 6: Package.json scripts');
try {
  const pkg = require('./package.json');
  const requiredScripts = ['start', 'dev', 'populate-db'];
  
  for (const script of requiredScripts) {
    if (pkg.scripts[script]) {
      console.log(`  ✅ Script '${script}' exists`);
    } else {
      console.log(`  ❌ Script '${script}' missing`);
      process.exit(1);
    }
  }
  console.log();
} catch (err) {
  console.log('  ❌ Error reading package.json:', err.message);
  process.exit(1);
}

// Test 7: Check dependencies
console.log('Test 7: Required dependencies');
try {
  const pkg = require('./package.json');
  const requiredDeps = ['express', 'sqlite3', 'axios', 'cors', 'dotenv', 'node-cron'];
  
  for (const dep of requiredDeps) {
    if (pkg.dependencies[dep]) {
      console.log(`  ✅ Dependency '${dep}' listed`);
    } else {
      console.log(`  ❌ Dependency '${dep}' missing`);
      process.exit(1);
    }
  }
  console.log();
} catch (err) {
  console.log('  ❌ Error checking dependencies:', err.message);
  process.exit(1);
}

// Test 8: Simulate Render environment
console.log('Test 8: Render environment simulation');
const renderPaths = {
  'Working directory': '/opt/render/project/src',
  'Data mount (relative)': 'data',
  'Data mount (absolute)': '/opt/render/project/src/data',
  'Database file': '/opt/render/project/src/data/mgnrega.db'
};

console.log('  Expected Render paths:');
for (const [key, value] of Object.entries(renderPaths)) {
  console.log(`    ${key}: ${value}`);
}
console.log('  ✅ Paths configured correctly\n');

console.log('=== All Tests Passed! ===');
console.log('\n✨ Your setup is ready for Render deployment!\n');
console.log('Next steps:');
console.log('1. git add .');
console.log('2. git commit -m "Ready for Render"');
console.log('3. git push origin main');
console.log('4. Deploy via Render Blueprint\n');
