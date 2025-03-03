module.exports = async (req, res) => {
  const fetch = require('node-fetch');
  try {
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent?query=techeducation&tweet.fields=text', {
      headers: { 'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}` }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tweets', details: error.message });
  }
};
