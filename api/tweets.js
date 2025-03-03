let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

module.exports = async (req, res) => {
  const fetch = require('node-fetch');
  const now = Date.now();

  // Serve cached data if available and not expired
  if (cachedData && (now - lastFetch < CACHE_DURATION)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(cachedData);
  }

  try {
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=techeducation&tweet.fields=text', {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`X API error: ${response.status} - ${data.title || 'Unknown'}`);
    }

    // Cache the successful response
    cachedData = data;
    lastFetch = now;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (error.message.includes('429')) {
      // Fallback to cached data if rate-limited and cache exists
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      return res.status(429).json({ error: 'Rate limit exceeded', details: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch tweets', details: error.message });
  }
};
