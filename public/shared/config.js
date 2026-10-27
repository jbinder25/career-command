// Who owns this deployment and which Supabase project it uses.
// SETUP.md step 3 fills these in (your name and email) and step 2 fills in the Supabase URL and key.
// Loaded by the pages as a plain <script>, and by middleware.js and the API functions as a module.
(function (config) {
  if (typeof module === 'object' && module.exports) module.exports = config;
  else globalThis.CAREER_CONFIG = config;
})({
  siteName: 'Career Command Center',
  appName: 'Career Command Center',
  ownerName: 'Your Name',
  ownerEmails: ['you@example.com'], // lower case; only these addresses can sign in
  supabaseUrl: 'https://YOUR-PROJECT-REF.supabase.co',
  supabaseKey: 'sb_publishable_REPLACE_ME', // the publishable (anon) key; never the secret key
  timezone: 'America/New_York', // an IANA time zone; sets the day boundary for the daily lead cap
});
