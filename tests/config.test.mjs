import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const CONFIG = require('../public/shared/config.js');
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('config has the expected shape', () => {
  for (const k of ['siteName', 'ownerName', 'supabaseKey']) assert.ok(typeof CONFIG[k] === 'string' && CONFIG[k].trim(), k);
  assert.ok(Array.isArray(CONFIG.ownerEmails) && CONFIG.ownerEmails.length);
  for (const e of CONFIG.ownerEmails) assert.ok(/^[^@\s]+@[^@\s]+$/.test(e) && e === e.toLowerCase(), e);
  assert.match(CONFIG.supabaseUrl, /^https:\/\//);
  assert.doesNotThrow(() => new Intl.DateTimeFormat('en-CA', { timeZone: CONFIG.timezone }));
});

test('only config.js holds the Supabase URL and key', () => {
  for (const f of ['middleware.js', 'public/login/index.html', 'public/career/index.html', 'api/job-scan.js']) {
    const src = read(f);
    assert.ok(!/supabase\.co/.test(src), f + ' has a literal supabase.co URL');
    assert.ok(!/sb_publishable_/.test(src), f + ' has a literal publishable key');
  }
});

test('middleware matcher excludes shared/config.js', () => {
  assert.match(read('middleware.js'), /matcher:\[[^\]]*shared\/config\\\\\.js\$/);
});
