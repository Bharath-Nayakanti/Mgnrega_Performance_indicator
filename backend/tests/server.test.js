const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const { normalizeYear, expandYearFormat } = require('../server.js');

test('frontend catch-all route excludes /api routes', () => {
  assert.match(source, /app\.get\(\s*\/\^\(\?!\\\/api\)/);
});

test('normalizeYear keeps UI fiscal years in the YYYY-YY format', () => {
  assert.equal(normalizeYear('2021-22'), '2021-22');
  assert.equal(normalizeYear('2021-2022'), '2021-22');
  assert.equal(normalizeYear('2024-25'), '2024-25');
});

test('expandYearFormat converts UI fiscal years to database format', () => {
  assert.equal(expandYearFormat('2021-22'), '2021-2022');
  assert.equal(expandYearFormat('2024-25'), '2024-2025');
});
