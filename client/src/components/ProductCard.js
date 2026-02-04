import React from "react";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiPackage,
  FiActivity,
  FiAlertCircle,
  FiZap,
} from "react-icons/fi";
import "./ProductCard.css";
import { useSelector } from "react-redux";
import TargetSetter from "./TagetSetter";

import { useState } from "react";

const ProductCard = ({ product }) => {
  const dailyGoal = useSelector((state) => state?.nutrition?.dailyGoal) || 2000;
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  if (!product) return null;

  // 1. Calculate the Multiplier based on quantity (e.g., "500 g")
  const getMultiplier = () => {
    if (!product.quantity) return 1;
    // Extract numbers from string like "500g" or "500 ml"
    const weightMatch = product.quantity.match(/(\d+(\.\d+)?)/);
    if (!weightMatch) return 1;

    const weight = parseFloat(weightMatch[0]);
    // If it's in Kg or L, multiply by 1000 first
    const isLargeUnit =
      /kg|l/i.test(product.quantity) && !/ml/i.test(product.quantity);
    const weightInGrams = isLargeUnit ? weight * 1000 : weight;

    return weightInGrams / 100;
  };

  const multiplier = getMultiplier();
  const hasTotalData = multiplier !== 1;

  // FIXED: Use Math.ceil for whole numbers only
  const totalKals = Math.ceil(
    (product.nutritionData?.energy || 0) * multiplier,
  );

  // Daily Goal Logic
  const kalsRemaining = Math.max(0, dailyGoal - totalKals);
  const percentageOfGoal = (totalKals / dailyGoal) * 100;

  const getHealthGrade = (score) => {
    if (score >= 75)
      return { label: "Excellent", color: "#00d084", icon: FiCheckCircle };
    if (score >= 60)
      return { label: "Good", color: "#4ade80", icon: FiCheckCircle };
    if (score >= 45)
      return { label: "Moderate", color: "#fbbf24", icon: FiAlertTriangle };
    if (score >= 30)
      return { label: "Poor", color: "#fb923c", icon: FiAlertCircle };
    return { label: "Very Poor", color: "#ef4444", icon: FiXCircle };
  };

  const getNutriScoreColor = (score) => {
    const colors = {
      A: "#00d084",
      B: "#85cc00",
      C: "#fbbf24",
      D: "#fb923c",
      E: "#ef4444",
    };
    return colors[score] || "#6b7280";
  };

  const grade = getHealthGrade(product.healthScore);
  const GradeIcon = grade.icon;

  return (
    <>
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with Image */}

        <div className="product-header">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <FiPackage />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h2 className="product-name">{product.productName}</h2>
          {product.brands && <p className="product-brand">{product.brands}</p>}
        </div>

        <div className="pc-scores-wrapper">
          {/* Health Score */}
          <motion.div
            className="pc-health-score-section"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div
              className="pc-score-circle"
              style={{
                background: `conic-gradient(${grade.color} ${product.healthScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
              }}
            >
              <div className="pc-score-inner">
                <span className="pc-score-value">{product.healthScore}</span>
                <span className="pc-score-max">/100</span>
              </div>
            </div>
            <div className="pc-score-label">
              <GradeIcon style={{ color: grade.color }} />
              <span style={{ color: grade.color }}>{grade.label}</span>
            </div>
          </motion.div>
        </div>

        {/* Nutri-Score Badge */}
        {product.nutriScore && product.nutriScore !== "N/A" && (
          <div className="nutri-score-badge">
            <span className="nutri-label">Nutri-Score</span>
          </div>
        )}

        {/* Nutrition Grid */}
        {product.nutritionData && (
          <div className="nutrition-grid">
            <h3 className="nutrition-title">
              <FiActivity />
              Nutrition Facts (per 100g)
            </h3>
            <div className="nutrition-items">
              {product.nutritionData.energy && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Energy</span>
                  <span className="nutrition-value">
                    {Math.ceil(product.nutritionData.energy)} kcal
                  </span>
                </div>
              )}
              {product.nutritionData.fat !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">
                    {product.nutritionData.fat.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.saturatedFat !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Saturated Fat</span>
                  <span className="nutrition-value">
                    {product.nutritionData.saturatedFat.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.carbohydrates !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">
                    {product.nutritionData.carbohydrates.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.sugars !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Sugars</span>
                  <span className="nutrition-value">
                    {product.nutritionData.sugars.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.fiber !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber</span>
                  <span className="nutrition-value">
                    {product.nutritionData.fiber.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.proteins !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">
                    {product.nutritionData.proteins.toFixed(1)}g
                  </span>
                </div>
              )}
              {product.nutritionData.salt !== undefined && (
                <div className="nutrition-item">
                  <span className="nutrition-label">Salt</span>
                  <span className="nutrition-value">
                    {product.nutritionData.salt.toFixed(2)}g
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Info (Existing) */}
        <div className="additional-info">
          {product.additives > 0 && (
            <div className="info-badge warning">
              <FiAlertCircle />
              {product.additives} Additive{product.additives > 1 ? "s" : ""}
            </div>
          )}
          {product.novaGroup && (
            <div
              className={`info-badge ${product.novaGroup >= 3 ? "warning" : "success"}`}
            >
              NOVA Group {product.novaGroup}
            </div>
          )}
        </div>

        {/* NEW: Total Calories Summary Strip */}
        {product.nutritionData?.energy && (
          <div className="total-energy-footer">
            <div className="energy-content">
              <div className="energy-text">
                <span className="energy-label">Total Energy Estimate</span>
                <p className="energy-subtext">Based on provided 100g data</p>
              </div>
              <div className="energy-display">
                {/* FIXED: Use Math.ceil here too */}
                <span className="energy-number">
                  {Math.ceil(product.nutritionData.energy)}
                </span>
                <span className="energy-unit">kcal</span>
              </div>
            </div>

            {/* Progress bar showing calories relative to daily 2000kcal intake */}
            <div className="energy-bar-container">
              <motion.div
                className="energy-bar-fill"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((product.nutritionData.energy / 2000) * 100, 100)}%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* FULL PRODUCT TOTALS SECTION */}
            {product.nutritionData && product.quantity && (
              <div className="total-impact-section">
                <h3 className="impact-title">
                  <FiPackage /> Full Package Impact ({product.quantity})
                </h3>

                {/* 1. Total Calories Bar - FIXED: Use Math.ceil */}
                <div className="impact-stat-group">
                  <div className="impact-info">
                    <span className="impact-label">Total Energy</span>
                    <span className="impact-value">
                      {Math.ceil(product.nutritionData.energy * multiplier)}{" "}
                      kcal
                    </span>
                  </div>
                  <div className="impact-bar-bg">
                    <motion.div
                      className="impact-bar-fill energy"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((product.nutritionData.energy * multiplier) / 2000) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* 2. Total Sugar Bar (Based on 50g daily recommended limit) */}
                <div className="impact-stat-group">
                  <div className="impact-info">
                    <span className="impact-label">Total Sugars</span>
                    <span className="impact-value">
                      {(
                        (product.nutritionData.sugars || 0) * multiplier
                      ).toFixed(1)}
                      g
                    </span>
                  </div>
                  <div className="impact-bar-bg">
                    <motion.div
                      className="impact-bar-fill sugar"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((product.nutritionData.sugars * multiplier) / 50) * 100, 100)}%`,
                      }}
                      transition={{
                        duration: 1.4,
                        ease: "easeOut",
                        delay: 0.1,
                      }}
                    />
                  </div>
                </div>

                {/* 3. Total Fat Bar (Based on 70g daily recommended limit) */}
                <div className="impact-stat-group">
                  <div className="impact-info">
                    <span className="impact-label">Total Fats</span>
                    <span className="impact-value">
                      {((product.nutritionData.fat || 0) * multiplier).toFixed(
                        1,
                      )}
                      g
                    </span>
                  </div>
                  <div className="impact-bar-bg">
                    <motion.div
                      className="impact-bar-fill fat"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(((product.nutritionData.fat * multiplier) / 70) * 100, 100)}%`,
                      }}
                      transition={{
                        duration: 1.6,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};
export default ProductCard;
