const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3000;

// Helper to fetch items from Roblox API
async function fetchRobloxItems({ name, type }) {
  const params = {
    Category: 'All',
    SortType: 3,
    Limit: 30,
    AssetType: type
  };

  // If name is not empty, use it as a keyword
  if (name) {
    params.Keyword = name;
  } else {
    // For random, remove Keyword and randomize sort order
    params.SortType = Math.floor(Math.random() * 5) + 1; // Random sort type between 1-5
  }

  const response = await axios.get('https://catalog.roblox.com/v1/search/items', { params });
  return response.data.data.map(item => item.id);
}

app.get('/search', async (req, res) => {
  const { name, type } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing type' });
  }

  try {
    const items = await fetchRobloxItems({ name, type });
    res.json(items);
  } catch (error) {
    console.error('Roblox API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Roblox' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy running on http://localhost:${PORT}`);
});
