let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

module.exports = async (req, res) => {
  const fetch = require('node-fetch');
  const now = Date.now();
  const query = req.query.q || 'edtech'; // Default to 'edtech' if no query

  // Cache key includes query to differentiate results
  const cacheKey = `tweets-${query}`;
  if (cachedData && cachedData.key === cacheKey && (now - lastFetch < CACHE_DURATION)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(cachedData.data);
  }

  try {
    const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=text`, {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`X API error: ${response.status} - ${data.title || 'Unknown'}`);
    }

    // Cache the response with query-specific key
    cachedData = { key: cacheKey, data: data };
    lastFetch = now;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (error.message.includes('429')) {
      if (cachedData && cachedData.key === cacheKey) {
        return res.status(200).json(cachedData.data);
      }
      return res.status(429).json({ error: 'Rate limit exceeded', details: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch tweets', details: error.message });
  }
};
