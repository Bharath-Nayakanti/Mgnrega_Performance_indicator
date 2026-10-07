const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('frontend catch-all route excludes /api routes', () => {
  assert.match(source, /app\.get\(\s*\/\^\(\?!\\\/api\)/);
});
