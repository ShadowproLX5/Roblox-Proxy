const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

app.get("/catalog", async (req, res) => {
    const { keyword = "", limit = 10 } = req.query;

    try {
        const response = await axios.get("https://catalog.roblox.com/v1/search/items", {
            params: {
                Keyword: keyword,
                Limit: limit,
                SortType: 3,
                SalesTypeFilter: 1 // all types (free + paid)
            },
            headers: {
                "User-Agent": "Roblox/WinInet",
                "Accept": "application/json"
            }
        });

        const items = response.data.data.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price ?? "Free",
            creator: item.creatorName,
            thumbnail: item.thumbnail?.imageUrl ?? null
        }));

        res.json(items);
    } catch (err) {
        console.error("Catalog fetch error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to fetch catalog data" });
    }
});

app.listen(port, () => {
    console.log(`✅ Roblox Catalog Proxy running on http://localhost:${port}`);
});
