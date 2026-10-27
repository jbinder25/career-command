import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../public/', import.meta.url);
const page = fs.readFileSync(new URL('career/index.html', root), 'utf8');

test('Word and PDF export libraries are served from the site, not a CDN', () => {
  assert.ok(!/esm\.sh\/docx|cdn\.jsdelivr\.net\/npm\/pdfmake|unpkg\.com\/(docx|pdfmake)/.test(page), 'career page loads export libraries from a CDN');
  for (const f of ['docx-9.5.1.iife.js', 'pdfmake-0.2.20.min.js', 'pdfmake-vfs-0.2.20.js']) {
    assert.ok(page.includes('/vendor/' + f), `career page does not load /vendor/${f}`);
    assert.ok(fs.statSync(new URL('vendor/' + f, root)).size > 100000, `${f} is missing or empty`);
  }
  assert.match(fs.readFileSync(new URL('vendor/docx-9.5.1.iife.js', root), 'utf8').slice(0, 40), /^var docx = /);
});
