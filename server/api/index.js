const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet"); // NEW: Security headers
const NodeCache = require("node-cache"); // NEW: Caching library
require("dotenv").config();

const app = express();

// Simple In-Memory Cache (Lasts 10 minutes)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/* =========================
   Middleware
========================= */

// Security Headers
app.use(helmet());

// Body parser
app.use(express.json());

// CORS
const whitelist = ["http://localhost:3000", ""]; // Add your frontend port here!

const corsOptions = {
  origin: function (origin, callback) {
    // Added !origin check to allow tools like Postman that don't send an origin
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// ⬇️ ADD THIS LINE HERE ⬇️
app.use(cors(corsOptions));

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 requests/minute
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

/* =========================
   MongoDB Connection (Serverless Ready)
========================= */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in .env");
}

// Global is used here to maintain a cached connection across hot reloads
// in development and prevent exhausting connection limits in production
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maximum connections in the pool
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* =========================
   Models
========================= */

const ScanHistorySchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, index: true }, // PRO: Added Index
    productName: String,
    brands: String,
    imageUrl: String,
    healthScore: Number,
    nutriScore: String,
    scannedAt: { type: Date, default: Date.now },
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

// Compound Index for better performance on history lookups
ScanHistorySchema.index({ userId: 1, scannedAt: -1 });

const ScanHistory = mongoose.model("ScanHistory", ScanHistorySchema);

/* =========================
   Health Score Algorithm
========================= */

function calculateHealthScore(product) {
  let score = 50;
  const n = product.nutriments || {}; // OpenFoodFacts returns 'nutriments'

  // Nutri-score impact
  const nutriScorePoints = { a: 25, b: 15, c: 5, d: -10, e: -25 };
  score += nutriScorePoints[product.nutriscore_grade?.toLowerCase()] || 0;

  // Sugar penalty
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

  // FIXED: Removed extra parenthesis
  return Math.max(0, Math.min(100, Math.round(score)));
}

/* =========================
   Routes
========================= */

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Nutritional Insights API running 🚀" });
});

app.get("/product/:barcode", async (req, res) => {
  await connectToDatabase();
  try {
    const { barcode } = req.params;

    // 1. Check Cache first (Performance Boost)
    const cachedProduct = cache.get(barcode);
    if (cachedProduct) {
      console.log(`📦 Cache hit for ${barcode}`);
      return res.json(cachedProduct);
    }

    // 2. Validate barcode (Strict EAN-8 or EAN-13)
    if (!/^\d{8,13}$/.test(barcode)) {
      return res.status(400).json({ error: "Invalid barcode format" });
    }

    // 3. Fetch from API
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
      return res.status(404).json({ error: "Product not found" });
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

    // 4. Set Cache
    cache.set(barcode, productData);

    res.json(productData);
  } catch (error) {
    console.error("❌ Error fetching product:", error.message);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/scan-history", async (req, res) => {
  await connectToDatabase();
  try {
    const scan = new ScanHistory(req.body);
    await scan.save();
    res.status(201).json({ message: "Scan saved ✅", data: scan });
  } catch (error) {
    console.error("❌ Error saving scan:", error.message);
    res.status(500).json({ error: "Failed to save scan" });
  }
});

app.get("/scan-history", async (req, res) => {
  await connectToDatabase();
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await ScanHistory.find()
      .sort({ scannedAt: -1 })
      .limit(limit)
      .lean();

    res.json(history);
  } catch (error) {
    console.error("❌ Error fetching history:", error.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.delete("/scan-history/:id", async (req, res) => {
  await connectToDatabase();
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

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  connectToDatabase()
    .then(() => {
      console.log("✅ MongoDB Connected");
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ Failed to connect to MongoDB", err);
      process.exit(1);
    });
}

// EXPORT for Vercel
module.exports = app;
