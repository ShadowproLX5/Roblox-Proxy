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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const items = searchRes.data.data || [];
    console.log(`✅ Received ${items.length} item(s) from Roblox`);

    if (items.length === 0) return res.json({ results: [] });

    const detailedItems = await Promise.all(
      items
        .filter(item => item.assetType) // Filter out invalid entries
        .map(async item => {
          try {
            const detailRes = await axios.get(`https://economy.roblox.com/v1/assets/${item.id}/details`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            });

            const info = detailRes.data;

            return {
              id: item.id,
              name: info?.Name?.trim() || "Unknown Item",
              price: typeof info?.PriceInRobux === 'number' ? info.PriceInRobux : null,
              creator: info?.Creator?.Name || "Unknown Creator",
              thumbnail: `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=420&height=420&format=png`,
              assetType: item.assetType
            };
          } catch (e) {
            console.warn(`⚠️ Failed to fetch details for item ${item.id}`);
            console.warn("  ↪ Error:", e.response?.data?.errors?.[0]?.message || e.message);
            return {
              id: item.id,
              name: item.name || "Unknown Item",
              price: item.lowestPrice || 0,
              creator: item.creatorName || "Unknown Creator",
              thumbnail: `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=420&height=420&format=png`,
              assetType: item.assetType ?? null
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
