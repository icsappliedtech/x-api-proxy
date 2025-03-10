let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MY_USER_ID = '104529710'; // Replace with your actual ID

module.exports = async (req, res) => {
  const fetch = require('node-fetch');
  const now = Date.now();
  const query = req.query.q;
  const cacheKey = query ? `search-${query}` : `user-${MY_USER_ID}`;

  if (cachedData && cachedData.key === cacheKey && (now - lastFetch < CACHE_DURATION)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(cachedData.data);
  }

  try {
    let url = query
      ? `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=text`
      : `https://api.twitter.com/2/users/${MY_USER_ID}/tweets?tweet.fields=text&max_results=10`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`X API error: ${response.status} - ${data.title || 'Unknown'}`);
    }

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
