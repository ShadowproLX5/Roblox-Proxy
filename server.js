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
        Subcategory: 'All',
        Limit: 30,
        SortType: 3,
        AssetType: type // user provides the raw numeric asset type directly
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error from Roblox API:', err.message);
    res.status(500).json({ error: 'Failed to fetch from Roblox' });
  }
});

app.listen(PORT, () => {
  console.log(`Simple proxy running at http://localhost:${PORT}`);
});
