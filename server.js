const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/search', async (req, res) => {
  const query = req.query.query || "";
  const assetTypeStr = req.query.assetType;

  console.log("🔍 Incoming request:");
  console.log("  • query =", query);
  console.log("  • assetType =", assetTypeStr);

  if (!assetTypeStr) {
    console.warn("⚠️ Missing assetType parameter");
    return res.status(400).json({ error: "Missing assetType parameter" });
  }

  const assetType = Number(assetTypeStr);
  if (isNaN(assetType)) {
    console.warn("⚠️ Invalid assetType parameter:", assetTypeStr);
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

  console.log("📦 Final API params:", params);

  try {
    const searchRes = await axios.get('https://catalog.roblox.com/v1/search/items', {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // realistic UA
      }
    });

    const items = searchRes.data.data || [];

    console.log(`✅ Received ${items.length} item(s) from Roblox`);

    if (items.length === 0) return res.json({ results: [] });

    // Fetch detailed info
    const detailedItems = await Promise.all(
      items.map(async item => {
        try {
          const detailRes = await axios.get(`https://economy.roblox.com/v1/assets/${item.id}/details`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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
        } catch (e) {
          console.warn(`⚠️ Failed to fetch details for item ${item.id}`);
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

    console.log("📤 Sending full item details");
    return res.json({ results: detailedItems });

  } catch (err) {
    console.error("❌ Proxy Error:");
    console.error("  Message:", err.message);
    if (err.response) {
      console.error("  Status:", err.response.status);
      console.error("  Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("  Stack:", err.stack);
    }

    return res.status(500).json({ error: "Failed to fetch item info" });
  }
});


app.get('/', (req, res) => {
  res.send('✅ Roblox Marketplace Proxy is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
