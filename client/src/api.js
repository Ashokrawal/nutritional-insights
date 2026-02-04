// client/src/api.js
import axios from "axios";

// 1. Use the Production URL from Vercel, or fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
