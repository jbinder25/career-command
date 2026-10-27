// Is this posting still open, and what does its application form ask? (POST, behind the site login gate.)
// Greenhouse publishes its questions; Lever and Ashby only confirm the posting is live.
const apply = require('./_lib/apply');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url, company } = req.body || {};
  if (!url) return res.status(400).json({ error: 'A posting link is required' });
  try {
    return res.status(200).json({ ...(await apply.inspect(String(url).slice(0, 600), String(company || '').slice(0, 120))), checked_at: new Date().toISOString() });
  } catch (err) {
    console.error('apply', err);
    return res.status(502).json({ error: 'Could not check the posting' });
  }
};
