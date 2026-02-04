import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const getBaseUrl = () => {
  // Try Vite env, then CRA env, then default to current host
  const envUrl =
    import.meta.env?.VITE_API_URL ||
    process.env?.REACT_APP_API_URL ||
    "http://localhost:5001";

  // REMOVED the + "/api" because the backend routes are at the root level
  return envUrl.replace(/\/$/, "");
};

const API_URL = getBaseUrl();
// Async thunks
export const fetchProduct = createAsyncThunk(
  "product/fetchProduct",
  async (barcode, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/product/${barcode}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to fetch product" },
      );
    }
  },
);

export const saveScanHistory = createAsyncThunk(
  "product/saveScanHistory",
  async (scanData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/scan-history`, scanData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to save scan" },
      );
    }
  },
);

export const fetchScanHistory = createAsyncThunk(
  "product/fetchScanHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/scan-history`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to fetch history" },
      );
    }
  },
);

export const deleteScanHistory = createAsyncThunk(
  "product/deleteScanHistory",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/scan-history/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Failed to delete scan" },
      );
    }
  },
);

const initialState = {
  currentProduct: null,
  scanHistory: [],
  loading: false,
  error: null,
  historyLoading: false,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProduct: (state) => {
      state.currentProduct = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save Scan History
      .addCase(saveScanHistory.fulfilled, (state) => {
        // Optionally handle success
      })
      // Fetch Scan History
      .addCase(fetchScanHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchScanHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.scanHistory = action.payload;
      })
      .addCase(fetchScanHistory.rejected, (state) => {
        state.historyLoading = false;
      })
      // Delete Scan History
      .addCase(deleteScanHistory.fulfilled, (state, action) => {
        state.scanHistory = state.scanHistory.filter(
          (scan) => scan._id !== action.payload,
        );
      });
  },
});

export const { clearProduct, clearError } = productSlice.actions;
export default productSlice.reducer;
