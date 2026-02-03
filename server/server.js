const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

/* =========================
   Middleware
========================= */

// Body parser
app.use(express.json());

// CORS (dev + prod)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://nutritional-insights-server-one.vercel.app/", // change later
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// Rate limiter (protect API)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests/minute
});
app.use("/api/", limiter);

/* =========================
   MongoDB Connection
========================= */

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nutritional-insights";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

/* =========================
   Models
========================= */

const ScanHistorySchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true },
    productName: String,
    brands: String,
    imageUrl: String,
    healthScore: Number,
    nutriScore: String,
    scannedAt: { type: Date, default: Date.now },

    // Future authentication support
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    nutritionData: {
      energy: Number,
      fat: Number,
      saturatedFat: Number,
      carbohydrates: Number,
      sugars: Number,
      fiber: Number,
      proteins: Number,
      salt: Number,
    },
  },
  { timestamps: true },
);

const ScanHistory = mongoose.model("ScanHistory", ScanHistorySchema);

/* =========================
   Health Score Algorithm
========================= */

function calculateHealthScore(product) {
  let score = 50;
  const n = product.nutriments || {};

  // Nutri-score impact
  const nutriScorePoints = { a: 25, b: 15, c: 5, d: -10, e: -25 };
  score += nutriScorePoints[product.nutriscore_grade?.toLowerCase()] || 0;

  // Sugar penalty (strong)
  if (n.sugars_100g !== undefined) {
    if (n.sugars_100g < 5) score += 10;
    else if (n.sugars_100g < 10) score += 5;
    else if (n.sugars_100g < 20) score -= 10;
    else score -= 25;
  }

  // Salt penalty
  if (n.salt_100g !== undefined) {
    if (n.salt_100g < 0.3) score += 10;
    else if (n.salt_100g < 1.5) score += 5;
    else score -= 15;
  }

  // Saturated fat penalty
  if (n["saturated-fat_100g"] !== undefined) {
    if (n["saturated-fat_100g"] < 1.5) score += 8;
    else if (n["saturated-fat_100g"] > 5) score -= 12;
  }

  // Fiber bonus
  if (n.fiber_100g !== undefined) {
    if (n.fiber_100g > 6) score += 15;
    else if (n.fiber_100g > 3) score += 8;
  }

  // Protein bonus
  if (n.proteins_100g !== undefined) {
    if (n.proteins_100g > 10) score += 10;
    else if (n.proteins_100g > 5) score += 5;
  }

  // Additives penalty
  const additives = product.additives_tags?.length || 0;
  if (additives > 5) score -= 15;
  else if (additives > 2) score -= 7;

  // Ultra-processed penalty (NOVA)
  if (product.nova_group === 4) score -= 20;
  else if (product.nova_group === 3) score -= 8;

  // Calories penalty
  if (n["energy-kcal_100g"] > 500) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* =========================
   Routes
========================= */

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Nutritional Insights API running 🚀" });
});

// Fetch product by barcode
app.get("/api/product/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;

    // Validate barcode
    if (!/^\d{8,14}$/.test(barcode)) {
      return res.status(400).json({ error: "Invalid barcode format" });
    }

    const response = await axios.get(
      `https://world.openfoodfacts.net/api/v2/product/${barcode}`,
      {
        headers: {
          "User-Agent":
            "NutritionalInsights/1.0 (https://github.com/Ashokrawal)",
        },
      },
    );

    if (response.data.status === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = response.data.product;
    const healthScore = calculateHealthScore(product);

    const productData = {
      barcode: product.code,
      productName: product.product_name || "Unknown Product",
      brands: product.brands || "Unknown Brand",
      imageUrl: product.image_url || product.image_front_url,
      categories: product.categories,
      healthScore,
      nutriScore: product.nutriscore_grade?.toUpperCase() || "N/A",
      novaGroup: product.nova_group,
      nutritionData: {
        energy: product.nutriments?.["energy-kcal_100g"],
        fat: product.nutriments?.fat_100g,
        saturatedFat: product.nutriments?.["saturated-fat_100g"],
        carbohydrates: product.nutriments?.carbohydrates_100g,
        sugars: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        proteins: product.nutriments?.proteins_100g,
        salt: product.nutriments?.salt_100g,
      },
      additives: product.additives_tags?.length || 0,
      ingredients: product.ingredients_text,
      allergens: product.allergens_tags,
    };

    res.json(productData);
  } catch (error) {
    console.error("❌ Error fetching product:", error.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Save scan history
app.post("/api/scan-history", async (req, res) => {
  try {
    const scan = new ScanHistory(req.body);
    await scan.save();
    res.status(201).json({ message: "Scan saved ✅", data: scan });
  } catch (error) {
    console.error("❌ Error saving scan:", error.message);
    res.status(500).json({ error: "Failed to save scan" });
  }
});

// Get scan history
app.get("/api/scan-history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await ScanHistory.find()
      .sort({ scannedAt: -1 })
      .limit(limit);

    res.json(history);
  } catch (error) {
    console.error("❌ Error fetching history:", error.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Delete scan history
app.delete("/api/scan-history/:id", async (req, res) => {
  try {
    await ScanHistory.findByIdAndDelete(req.params.id);
    res.json({ message: "Scan deleted 🗑️" });
  } catch (error) {
    console.error("❌ Error deleting scan:", error.message);
    res.status(500).json({ error: "Failed to delete scan" });
  }
});

/* =========================
   Start Server
========================= */

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
