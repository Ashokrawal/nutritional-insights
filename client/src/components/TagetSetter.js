import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setDailyGoal } from "../redux/targetKals";
import { FiTarget, FiEdit2 } from "react-icons/fi";
import "./TargetSetter.css";

const TargetSetter = () => {
  const dailyGoal = useSelector((state) => state.nutrition.dailyGoal);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const value = e.target.value;

    dispatch(setDailyGoal(value === "" ? 0 : parseInt(value)));
  };

  return (
    <div className="target-setter-container">
      <div className="target-header">
        <FiTarget className="target-icon" />
        <span>Daily Calorie Goal</span>
      </div>
      <div className="target-input-wrapper">
        <input
          type="number"
          value={dailyGoal === 0 ? "" : dailyGoal}
          onChange={handleChange}
          placeholder="e.g. 2000"
          className="target-input"
        />
        <span className="target-unit">kcal</span>
        <FiEdit2 className="edit-icon" />
      </div>
      <p className="target-hint">
        Your goal is used to calculate the budget remaining on scanned products.
      </p>
    </div>
  );
};

export default TargetSetter;
