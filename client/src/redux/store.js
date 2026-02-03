import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./productSlice";
import nutritionReducer from "./targetKals";

export const store = configureStore({
  reducer: {
    product: productReducer,
    nutrition: nutritionReducer,
  },
});
