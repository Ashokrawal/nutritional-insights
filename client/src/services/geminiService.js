// src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

/**
 * Analyzes product ingredients using Gemini AI with professional-grade analysis
 * @param {Object} product - Product object with ingredients
 * @returns {Promise<Object>} Analysis result with harmful ingredients, health score, etc.
 */
export const analyzeProductIngredients = async (product) => {
  try {
    if (!product || !product.ingredients) {
      throw new Error("Product ingredients not available");
    }

    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      { apiVersion: "v1" },
    );

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

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    if (text.includes("```json")) {
      jsonText = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      jsonText = text.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(jsonText);

    return {
      success: true,
      data: analysis,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze ingredients",
      data: null,
    };
  }
};

/**
 * Get quick health assessment for a product
 * @param {Object} product - Product object
 * @returns {Promise<string>} Quick health verdict
 */
export const getQuickHealthVerdict = async (product) => {
  try {
    if (!product || !product.ingredients) {
      return "Unable to assess - ingredients not available";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    return response.text().trim();
  } catch (error) {
    console.error("Quick verdict error:", error);
    return "Assessment unavailable";
  }
};

/**
 * Compare two products and recommend the healthier option
 * @param {Object} product1 - First product
 * @param {Object} product2 - Second product
 * @returns {Promise<Object>} Comparison result
 */
export const compareProducts = async (product1, product2) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    let jsonText = text;
    if (text.includes("```json")) {
      jsonText = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      jsonText = text.split("```")[1].split("```")[0].trim();
    }

    return {
      success: true,
      data: JSON.parse(jsonText),
    };
  } catch (error) {
    console.error("Product comparison error:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

const geminiService = {
  analyzeProductIngredients,
  getQuickHealthVerdict,
  compareProducts,
};

// Then export it as the default
export default geminiService;
