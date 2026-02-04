const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const NodeCache = require("node-cache");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // 1. Import AI Library
require("dotenv").config();

const app = express();

// Simple In-Memory Cache (Lasts 10 minutes)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/* =========================
   Middleware
========================= */

app.use(helmet());
app.use(express.json());

// CORS
// ADD YOUR DEPLOYED FRONTEND URL HERE (e.g., "https://your-app.vercel.app")
const whitelist = [
  "http://localhost:3000",
  "https://nutritional-insights-f3wh.vercel.app/",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 requests/minute
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

/* =========================
   MongoDB Connection
========================= */

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in .env");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false, maxPoolSize: 10 };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/* =========================
   Models
========================= */

const ScanHistorySchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, index: true },
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
ScanHistorySchema.index({ userId: 1, scannedAt: -1 });
const ScanHistory = mongoose.model("ScanHistory", ScanHistorySchema);

/* =========================
   Health Score Algorithm
========================= */

function calculateHealthScore(product) {
  let score = 50;
  const n = product.nutriments || {};
  const nutriScorePoints = { a: 25, b: 15, c: 5, d: -10, e: -25 };
  score += nutriScorePoints[product.nutriscore_grade?.toLowerCase()] || 0;

  if (n.sugars_100g !== undefined) {
    if (n.sugars_100g < 5) score += 10;
    else if (n.sugars_100g < 10) score += 5;
    else if (n.sugars_100g < 20) score -= 10;
    else score -= 25;
  }
  if (n.salt_100g !== undefined) {
    if (n.salt_100g < 0.3) score += 10;
    else if (n.salt_100g < 1.5) score += 5;
    else score -= 15;
  }
  if (n["saturated-fat_100g"] !== undefined) {
    if (n["saturated-fat_100g"] < 1.5) score += 8;
    else if (n["saturated-fat_100g"] > 5) score -= 12;
  }
  if (n.fiber_100g !== undefined) {
    if (n.fiber_100g > 6) score += 15;
    else if (n.fiber_100g > 3) score += 8;
  }
  if (n.proteins_100g !== undefined) {
    if (n.proteins_100g > 10) score += 10;
    else if (n.proteins_100g > 5) score += 5;
  }
  const additives = product.additives_tags?.length || 0;
  if (additives > 5) score -= 15;
  else if (additives > 2) score -= 7;
  if (product.nova_group === 4) score -= 20;
  else if (product.nova_group === 3) score -= 8;
  if (n["energy-kcal_100g"] > 500) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* =========================
   AI Helper Functions
========================= */

// Initialize Gemini with Server-Side Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to parse JSON from AI response (strips markdown)
function parseAIResponse(text) {
  let jsonText = text;
  if (text.includes("```json")) {
    jsonText = text.split("```json")[1].split("```")[0].trim();
  } else if (text.includes("```")) {
    jsonText = text.split("```")[1].split("```")[0].trim();
  }
  return JSON.parse(jsonText);
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
    const cachedProduct = cache.get(barcode);
    if (cachedProduct) {
      console.log(`📦 Cache hit for ${barcode}`);
      return res.json(cachedProduct);
    }
    if (!/^\d{8,13}$/.test(barcode)) {
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
   AI Routes (Integrated from Frontend)
========================= */

app.post("/api/analyze", async (req, res) => {
  try {
    const { product } = req.body;
    if (!product || !product.ingredients) {
      return res
        .status(400)
        .json({ error: "Product ingredients not available" });
    }

    // FIXED: Used "gemini-1.5-flash" instead of 2.5 (which doesn't exist)
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      // { apiVersion: "v1" },
    );

    // EXACT PROMPT FROM YOUR WORKING CODE
    const prompt = `
You are a professional food scientist and nutritionist with 20+ years of experience. Analyze this product thoroughly:

Product Name: ${product.productName || "Unknown"}
Brand: ${product.brands || product.brand || "Unknown"}
Category: ${product.category || "Unknown"}
Ingredients: ${product.ingredients}

Provide a COMPREHENSIVE, PROFESSIONAL analysis in this JSON format:
{
  "healthScore": <number 0-100>,
  "overallAssessment": "<3-4 sentence professional summary covering quality, concerns, and recommendation>",
  "bottomLine": "<One clear sentence: Should consumers buy this? Why or why not?>",
  
  "harmfulIngredients": [
    {
      "name": "<exact ingredient name>",
      "type": "<preservative/additive/artificial color/sweetener/emulsifier/etc>",
      "riskLevel": "<low/medium/high>",
      "healthConcerns": "<detailed health risks with scientific backing>",
      "alternativeSuggestion": "<specific healthier alternative>"
    }
  ],
  
  "beneficialIngredients": [
    {
      "name": "<ingredient name>",
      "benefit": "<detailed health benefits and nutritional value>"
    }
  ],
  
  "preservatives": [
    {
      "name": "<preservative name with E-number if applicable>",
      "purpose": "<why it's used: shelf life, prevent mold, etc>",
      "safetyLevel": "<safe/concerns exist/avoid if possible>",
      "concerns": "<specific health concerns or reactions>",
      "naturalAlternatives": "<natural alternatives like rosemary extract, vitamin E>"
    }
  ],
  
  "personalizedRecommendations": {
    "forDiabetics": "<Blood sugar impact? Glycemic concerns? Safe portions? Better alternatives?>",
    "forWeightLoss": "<Good for cutting? Calorie density? Hidden sugars? Satiety factor? Portion advice?>",
    "forMuscleBuilding": "<Good for bulking? Protein quality? Carb timing? Recovery benefits? Why?>",
    "forHeartHealth": "<Sodium concerns? Trans fats? Saturated fats? Cholesterol? Blood pressure effects?>",
    "forKids": "<Safe for children? Age-appropriate? Additives affecting behavior? Sugar content?>",
    "forPregnancy": "<Safe during pregnancy? Nutrients needed? Any concerning ingredients?>",
    "forSeniors": "<Digestibility? Sodium for blood pressure? Nutrient density? Medication interactions?>"
  },
  
  "allergenAlert": [
    "<List ALL allergens: milk, eggs, fish, shellfish, nuts, peanuts, wheat, soy, sesame>",
    "<Include 'may contain' warnings and cross-contamination risks>"
  ],
  
  "warnings": [
    "<Specific warnings for: pregnant women, children, diabetics, heart patients, etc>",
    "<Explain WHY each group should be cautious with specific health reasons>"
  ],
  
  "recommendations": [
    "<Maximum safe consumption frequency: daily/weekly/occasionally/avoid>",
    "<Optimal serving size for different populations>",
    "<Best time to consume or avoid>",
    "<What to pair it with to improve nutrition>",
    "<Healthier brand alternatives if available>",
    "<DIY/homemade alternatives if applicable>"
  ],
  
  "nutritionalConcerns": [
    "<Sugar content vs WHO guidelines (max 25g/day)>",
    "<Sodium vs RDA (max 2300mg/day)>",
    "<Trans fats or saturated fats concerns>",
    "<Low protein/fiber content>",
    "<High calorie density vs nutrient density>",
    "<Refined vs whole grain ingredients>"
  ],
  
  "processingLevel": {
    "novaGroup": "<1 (unprocessed), 2 (processed culinary), 3 (processed), or 4 (ultra-processed)>",
    "explanation": "<Why this classification? What makes it processed? Health implications?>",
    "minimumProcessingAlternatives": "<Suggest less processed alternatives>"
  },
  
  "environmentalAndEthicalNotes": "<Brief note on: palm oil, sustainability, carbon footprint, fair trade>"
}

CRITICAL FOCUS - Identify and analyze:
**Preservatives**: BHA (E320), BHT (E321), TBHQ, Sodium Benzoate (E211), Potassium Sorbate (E202), Sulfites (E220-228), Sodium Nitrite (E250), Sodium Nitrate (E251), Propionic Acid (E280)

**Artificial Colors**: Tartrazine (E102/Yellow 5), Sunset Yellow (E110/Yellow 6), Allura Red (E129/Red 40), Brilliant Blue (E133/Blue 1), Erythrosine (E127/Red 3)

**Artificial Sweeteners**: Aspartame (E951), Sucralose (E955), Saccharin (E954), Acesulfame K (E950)

**Trans Fats**: Partially hydrogenated oils, hydrogenated vegetable oil

**Flavor Enhancers**: MSG (E621), Disodium Guanylate (E627), Disodium Inosinate (E631)

**Emulsifiers**: Polysorbate 80 (E433), Carrageenan (E407), Carboxymethylcellulose (E466)

**Highly Processed Sugars**: High Fructose Corn Syrup, Corn Syrup Solids, Maltodextrin

Be professional, evidence-based, specific, and thorough. Prioritize by risk level.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const analysis = parseAIResponse(text);

    res.json({
      success: true,
      data: analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ AI Analysis Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze ingredients",
    });
  }
});

app.post("/api/verdict", async (req, res) => {
  try {
    const { product } = req.body;
    if (!product || !product.ingredients) {
      return res.status(400).json({ error: "Ingredients not available" });
    }

    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      // { apiVersion: "v1" },
    );

    const prompt = `
As a food safety expert, analyze: ${product.ingredients}

Provide ONE sentence (max 20 words):
- EXCELLENT: nutrient-dense, minimal processing
- GOOD: mostly healthy, minor concerns
- MODERATE: some concerns, occasional consumption  
- POOR: multiple red flags, limit intake
- AVOID: significant health risks

Format: "Verdict: [LEVEL] - [brief reason]"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ success: true, verdict: response.text().trim() });
  } catch (error) {
    console.error("❌ Verdict Error:", error);
    res.status(500).json({ success: false, error: "Assessment unavailable" });
  }
});

app.post("/api/compare", async (req, res) => {
  try {
    const { product1, product2 } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Compare these two products professionally:

Product A:
Name: ${product1.productName}
Brand: ${product1.brands || "Unknown"}
Ingredients: ${product1.ingredients}

Product B:
Name: ${product2.productName}
Brand: ${product2.brands || "Unknown"}
Ingredients: ${product2.ingredients}

Provide detailed comparison in JSON format:
{
  "healthierChoice": "<A or B or TIE>",
  "confidenceLevel": "<high/medium/low>",
  "overallReasoning": "<3-4 sentences explaining why, covering ingredients, processing, nutrition>",
  
  "detailedComparison": {
    "ingredients": {
      "productA": "<quality assessment>",
      "productB": "<quality assessment>",
      "winner": "<A or B or TIE>"
    },
    "additives": {
      "productA": "<number and severity>",
      "productB": "<number and severity>",
      "winner": "<A or B or TIE>"
    },
    "processing": {
      "productA": "<NOVA group>",
      "productB": "<NOVA group>",
      "winner": "<A or B or TIE>"
    }
  },
  
  "keyDifferences": [
    "<specific difference 1>",
    "<specific difference 2>",
    "<specific difference 3>"
  ],
  
  "prosAndCons": {
    "productA": {
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"]
    },
    "productB": {
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"]
    }
  },
  
  "recommendation": "<Clear recommendation on which to choose and why>",
  "bottomLine": "<One sentence: definitive answer>"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const data = parseAIResponse(text);

    res.json({ success: true, data: data });
  } catch (error) {
    console.error("❌ Compare Error:", error);
    res.status(500).json({ success: false, error: error.message });
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

module.exports = app;
