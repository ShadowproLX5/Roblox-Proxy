const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  const query = req.query.query || "";
  const assetTypeStr = req.query.assetType;

  if (!assetTypeStr) {
    return res.status(400).json({ error: "Missing assetType parameter" });
  }

  const assetType = Number(assetTypeStr);
  if (isNaN(assetType)) {
    return res.status(400).json({ error: "Invalid assetType parameter" });
  }

  const params = {
    CatalogType: "Marketplace",
    Limit: 10,
    SortAggregation: query.trim() === "" ? 3 : 1,
    AssetTypes: [assetType]
  };

  if (query.trim() !== "") {
    params.Keyword = query;
  }

  try {
    // Step 1: Search catalog for item IDs
    const searchRes = await axios.get('https://catalog.roblox.com/v1/search/items', {
      params,
      headers: {
        'User-Agent': 'Roblox-Proxy/1.0'
      }
    });

    const items = searchRes.data.data;
    if (items.length === 0) return res.json({ results: [] });

    // Step 2: For each item, fetch full details via /v1/assets/{id}/details
    const detailedItems = await Promise.all(
      items.map(async item => {
        try {
          const detailRes = await axios.get(https://economy.roblox.com/v1/assets/${item.id}/details, {
            headers: {
              'User-Agent': 'Roblox-Proxy/1.0'
            }
          });

          const info = detailRes.data;
          return {
            id: item.id,
            name: info.Name || "Unknown Item",
            price: info.PriceInRobux || 0,
            creator: info.Creator?.Name || "Unknown Creator",
            thumbnail: item.thumbnail?.imageUrl || null,
            assetType: item.assetType
          };
        } catch {
          return {
            id: item.id,
            name: "Unknown Item",
            price: 0,
            creator: "Unknown Creator",
            thumbnail: null,
            assetType: item.assetType
          };
        }
      })
    );

    res.json({ results: detailedItems });

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch item info' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Roblox Marketplace Proxy is running with full item details');
});

app.listen(PORT, () => {
  console.log(✅ Server running on port ${PORT});
});
