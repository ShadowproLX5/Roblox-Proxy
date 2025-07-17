const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

app.get("/catalog", async (req, res) => {
    const { keyword = "", category = "All", limit = 10 } = req.query;

    // Build category type filter
    const categoryMap = {
        Hat: "Hat",
        Hair: "HairAccessory",
        Face: "FaceAccessory",
        Neck: "NeckAccessory",
        Shoulder: "ShoulderAccessory",
        Front: "FrontAccessory",
        Back: "BackAccessory",
        Waist: "WaistAccessory",
        Shirt: "Shirt",
        Pants: "Pants",
        Jacket: "Jacket",
        Sweater: "Sweater",
        TShirt: "TShirt",
        Classic: "ClassicClothing",
        Accessory: "Accessory",
        All: null
    };

    const assetType = categoryMap[category] || null;

    try {
        const response = await axios.get("https://catalog.roblox.com/v1/catalog/items", {
            params: {
                Keyword: keyword,
                Category: "3", // Avatar shop
                Limit: limit,
                SortType: 3,
                CreatorType: "User",
                SalesTypeFilter: "1", // All sales types
                AssetTypes: assetType ? assetType : undefined
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
    console.log(`Roblox Catalog Proxy running on http://localhost:${port}`);
});
