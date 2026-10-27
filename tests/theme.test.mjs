import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const PAGES = ['login/index.html', 'career/index.html'];
const TAG = '<script src="/shared/theme.js"></script>';

test('every served page loads the shared theme script in <head>, before its styles', () => {
  for (const p of PAGES) {
    const html = read('public/' + p);
    const at = html.indexOf(TAG);
    assert.ok(at > 0, `${p} is missing ${TAG}`);
    assert.ok(at < html.indexOf('</head>'), `${p}: theme.js must be in <head>`);
    const firstStyle = html.indexOf('<style');
    assert.ok(firstStyle === -1 || at < firstStyle, `${p}: theme.js must load before the first <style>`);
  }
});

test('no page keeps its own theme preference or a data-theme initialiser', () => {
  for (const p of PAGES) {
    const html = read('public/' + p);
    assert.doesNotMatch(html, /(?:get|set)Item\(\s*['"](?!site-theme)[\w-]*theme/, `${p} has a private theme key`);
    assert.doesNotMatch(html, /dataset\.theme\s*=/, `${p} sets data-theme itself`);
  }
});

test('the login gate lets the sign-in page load the theme script', () => {
  assert.match(read('middleware.js'), /shared\/theme\\\\\.js\$/);
});

test('dark-only pages carry a light palette generated for every colour token', () => {
  for (const p of ['career/index.html']) {
    const html = read('public/' + p);
    const dark = [...html.matchAll(/(--c-[\w-]+):/g)].map(m => m[1]);
    assert.ok(dark.length > 5, `${p} has no theme tokens`);
    const light = html.slice(html.indexOf('html[data-theme="light"]{'));
    for (const t of new Set(dark)) assert.ok(light.includes(t + ':'), `${p}: ${t} has no light value`);
  }
});

test('the career page opens opportunities on Overview and shows Tailor above the tabs, with no in-page sign-in', () => {
  const html = read('public/career/index.html');
  assert.match(html, /function openDetail\(id,pane='overview'\)/);
  assert.ok(html.indexOf('id="tailor-detail"') < html.indexOf('<div class="workspace-tabs">'), 'Tailor sits in the header, above the tabs');
  assert.equal(html.split('id="tailor-detail"').length - 1, 1);
  assert.doesNotMatch(html, /<section id="auth"|signInWithOtp|id="login"/, 'the old in-page sign-in is gone');
  assert.match(html, /location\.replace\('\/login\?next='/, 'an expired session goes to /login');
});

function run(storedValue, prefersLight, pageDefault) {
  const events = [], attrs = {}, cls = new Set(), store = storedValue ? { 'site-theme': storedValue } : {};
  const body = { classList: { toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)) }, appendChild() {} };
  const win = {
    matchMedia: () => ({ matches: prefersLight, addEventListener() {} }),
    addEventListener() {}, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } },
    dispatchEvent: e => events.push(e)
  };
  win.window = win;
  const ctx = vm.createContext({
    window: win, CustomEvent: win.CustomEvent,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
    document: {
      readyState: 'complete', body,
      documentElement: { setAttribute: (k, v) => { attrs[k] = v; }, getAttribute: k => (k === 'data-default-theme' ? pageDefault || null : null), style: {} },
      head: { appendChild() {} }, createElement: () => ({ setAttribute() {}, style: {}, set innerHTML(v) {} }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener() {}
    },
    MutationObserver: undefined
  });
  vm.runInContext(read('public/shared/theme.js'), ctx);
  return { api: win.SiteTheme, attrs, cls, events, store };
}

test('theme.js follows the device until a choice is made, then keeps it everywhere', () => {
  let t = run(null, true);
  assert.equal(t.attrs['data-theme'], 'light');
  assert.ok(t.cls.has('light'), 'legacy body.light stays in sync');
  t = run(null, false);
  assert.equal(t.attrs['data-theme'], 'dark');
  assert.ok(!t.cls.has('light'));
  t.api.toggle();
  assert.equal(t.store['site-theme'], 'light');
  assert.equal(t.attrs['data-theme'], 'light');
  assert.equal(t.events.at(-1).detail.theme, 'light');
  assert.equal(run('dark', true).attrs['data-theme'], 'dark', 'a saved choice beats the device setting');
  t.api.auto();
  assert.equal(t.store['site-theme'], undefined);
  assert.equal(t.attrs['data-theme'], 'dark', 'auto returns to the device setting');
});

test('a page can declare its default theme: stored choice, then page default, then device', () => {
  assert.equal(run(null, false, 'light').attrs['data-theme'], 'light', 'page default beats a dark device');
  assert.equal(run('dark', true, 'light').attrs['data-theme'], 'dark', 'a stored choice beats the page default');
  assert.equal(run(null, true, 'dark').attrs['data-theme'], 'dark', 'a dark page default beats a light device');
  assert.equal(run(null, true, undefined).attrs['data-theme'], 'light', 'no attribute: follow the device');
  assert.equal(run(null, false, undefined).attrs['data-theme'], 'dark', 'no attribute, dark device');
});
