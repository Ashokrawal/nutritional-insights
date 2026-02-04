import axios from "axios";

// Helper to get the Base URL (handles Local vs Production)
const getBaseUrl = () => {
  const envUrl = process.env?.REACT_APP_API_URL || "http://localhost:5001";
  return envUrl.replace(/\/$/, "");
};

const API_URL = getBaseUrl();

/**
 * Analyzes product ingredients using Backend Proxy
 */
export const analyzeProductIngredients = async (product) => {
  try {
    if (!product || !product.ingredients) {
      throw new Error("Product ingredients not available");
    }

    // Call YOUR backend, not Google directly
    const response = await axios.post(`${API_URL}/api/analyze`, { product });

    return response.data; // Returns { success: true, data: ..., analyzedAt: ... }
  } catch (error) {
    console.error("Backend AI Analysis Error:", error);

    // Return the error message from the server if available
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to analyze ingredients";

    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }
};

/**
 * Get quick health assessment for a product
 */
export const getQuickHealthVerdict = async (product) => {
  try {
    if (!product || !product.ingredients) {
      return "Unable to assess - ingredients not available";
    }

    const response = await axios.post(`${API_URL}/api/verdict`, { product });

    return response.data.verdict; // Returns the string directly
  } catch (error) {
    console.error("Backend Verdict Error:", error);
    return "Assessment unavailable";
  }
};

/**
 * Compare two products and recommend the healthier option
 */
export const compareProducts = async (product1, product2) => {
  try {
    const response = await axios.post(`${API_URL}/api/compare`, {
      product1,
      product2,
    });

    return response.data; // Returns { success: true, data: ... }
  } catch (error) {
    console.error("Backend Compare Error:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      data: null,
    };
  }
};

const geminiService = {
  analyzeProductIngredients,
  getQuickHealthVerdict,
  compareProducts,
};

export default geminiService;
