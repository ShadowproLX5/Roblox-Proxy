const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3000;

app.get('/search', async (req, res) => {
  const { name, type } = req.query;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing name or type' });
  }

  try {
    const response = await axios.get('https://catalog.roblox.com/v1/search/items', {
      params: {
        Keyword: name,
        Category: 'All',
        SortType: 3,
        Limit: 30,
        AssetType: type
      }
    });

    const idsOnly = response.data.data.map(item => item.id);
    res.json(idsOnly);
  } catch (error) {
    console.error('Roblox API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from Roblox' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy running on http://localhost:${PORT}`);
});
