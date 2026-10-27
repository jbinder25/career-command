/* Site-wide light/dark mode. Load synchronously in <head> so the page never flashes the wrong theme.
 *
 * One preference (localStorage "site-theme": "light" | "dark"; absent = the page's <html data-default-theme="light|dark">
 * if it declares one, otherwise follow the device) applies to every
 * page. It sets <html data-theme="light|dark"> and color-scheme, keeps the legacy `body.light` class in sync for
 * pages that still style that way, updates <meta name="theme-color">, and wires every [data-theme-toggle]
 * button. A page with no toggle of its own gets a small floating one.
 *
 *   data-theme-toggle              any button: click switches theme, aria-label/title say what it will do
 *   data-theme-text="long|short"   also write the target mode as text ("Dark mode" / "Dark")
 *
 * API: SiteTheme.get() · .set("light"|"dark") · .toggle() · .auto(); event "sitethemechange" on window.
 */
(function () {
  'use strict';
  var KEY = 'site-theme';
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  var BAR = { light: '#f6faff', dark: '#0b1020' };

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; }
  }
  function pageDefault() {
    var v = root.getAttribute && root.getAttribute('data-default-theme');
    return v === 'light' || v === 'dark' ? v : null;
  }
  function resolve() { return stored() || pageDefault() || (query && query.matches ? 'light' : 'dark'); }

  function syncBody(theme) {
    if (document.body) document.body.classList.toggle('light', theme === 'light');
  }

  function labels(theme) {
    var next = theme === 'light' ? 'dark' : 'light';
    var nodes = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < nodes.length; i++) {
      var b = nodes[i], label = 'Switch to ' + next + ' mode';
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
      b.setAttribute('aria-pressed', String(theme === 'light'));
      var t = b.getAttribute('data-theme-text');
      if (t) b.textContent = t === 'short' ? (next === 'dark' ? 'Dark' : 'Light') : (next === 'dark' ? 'Dark mode' : 'Light mode');
    }
  }

  function apply(theme, announce) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    syncBody(theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', BAR[theme]);
    labels(theme);
    if (announce) {
      try { window.dispatchEvent(new CustomEvent('sitethemechange', { detail: { theme: theme } })); } catch (e) { /* old browser */ }
    }
  }

  var api = window.SiteTheme = {
    get: resolve,
    set: function (theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode: still applies for this page */ }
      apply(theme, true);
    },
    toggle: function () { api.set(resolve() === 'light' ? 'dark' : 'light'); },
    auto: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      apply(resolve(), true);
    }
  };

  apply(resolve(), false);

  // <body> does not exist yet while this runs in <head>: tag it the moment it is parsed, before first paint.
  if (!document.body && window.MutationObserver) {
    var watch = new MutationObserver(function () {
      if (document.body) { syncBody(resolve()); watch.disconnect(); }
    });
    watch.observe(root, { childList: true });
  }

  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5a8.5 8.5 0 1 0 9.7 9.7z"/></svg>'
  };

  function floatingToggle() {
    if (document.querySelector('[data-theme-toggle]') || !document.body) return;
    var style = document.createElement('style');
    style.textContent =
      '.site-theme-btn{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:90;' +
      'width:44px;height:44px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;' +
      'border:1px solid rgba(128,148,176,.55);background:#fff;color:#192842;box-shadow:0 4px 16px rgba(0,0,0,.28)}' +
      'html[data-theme="dark"] .site-theme-btn{background:var(--site-theme-btn-dark,#151e31);color:#f4f7fd}' +
      '.site-theme-btn:hover{border-color:#3767ae}.site-theme-btn:focus-visible{outline:3px solid #3b82f6;outline-offset:3px}' +
      '.site-theme-btn span{display:flex;line-height:0}.site-theme-btn svg{display:block}' +
      '.site-theme-btn .moon{display:none}html[data-theme="light"] .site-theme-btn .sun{display:none}' +
      'html[data-theme="light"] .site-theme-btn .moon{display:flex}@media print{.site-theme-btn{display:none}}';
    document.head.appendChild(style);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'site-theme-btn';
    b.setAttribute('data-theme-toggle', '');
    b.innerHTML = '<span class="sun">' + ICONS.sun + '</span><span class="moon">' + ICONS.moon + '</span>';
    document.body.appendChild(b);
    labels(resolve());
  }

  function ready() {
    syncBody(resolve());
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', BAR[resolve()]);
    floatingToggle();
    labels(resolve());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
    if (t) { e.preventDefault(); api.toggle(); }
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(resolve(), true); });
  if (query) {
    var follow = function () { if (!stored()) apply(resolve(), true); };
    if (query.addEventListener) query.addEventListener('change', follow); else if (query.addListener) query.addListener(follow);
  }
})();
