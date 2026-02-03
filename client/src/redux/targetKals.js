import { createSlice } from "@reduxjs/toolkit";

// Get initial data from localStorage if it exists
const savedGoal = localStorage.getItem("dailyKalsGoal");
const savedConsumed = localStorage.getItem("consumedKals");

const initialState = {
  dailyGoal: Number(localStorage.getItem("dailyKalsGoal")) || 2000,
  consumedToday: Number(localStorage.getItem("consumedKals")) || 0,
};

const nutritionSlice = createSlice({
  name: "nutrition",
  initialState,
  reducers: {
    // Inside nutritionSlice.js
    setDailyGoal: (state, action) => {
      const newGoal = parseInt(action.payload) || 0;
      state.dailyGoal = newGoal;
      localStorage.setItem("dailyKalsGoal", newGoal);
    },
    addProductCalories: (state, action) => {
      // action.payload is the totalKals of the scanned product
      state.consumedToday += action.payload;
      localStorage.setItem("consumedKals", state.consumedToday);
    },
    resetDailyCalories: (state) => {
      state.consumedToday = 0;
      localStorage.setItem("consumedKals", 0);
    },
  },
});

export const { setDailyGoal, addProductCalories, resetDailyCalories } =
  nutritionSlice.actions;
export default nutritionSlice.reducer;
