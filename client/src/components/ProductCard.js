import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiXCircle,
  FiPackage,
  FiActivity,
  FiAlertCircle
} from 'react-icons/fi';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  if (!product) return null;

  const getHealthGrade = (score) => {
    if (score >= 75) return { label: 'Excellent', color: '#00d084', icon: FiCheckCircle };
    if (score >= 60) return { label: 'Good', color: '#4ade80', icon: FiCheckCircle };
    if (score >= 45) return { label: 'Moderate', color: '#fbbf24', icon: FiAlertTriangle };
    if (score >= 30) return { label: 'Poor', color: '#fb923c', icon: FiAlertCircle };
    return { label: 'Very Poor', color: '#ef4444', icon: FiXCircle };
  };

  const getNutriScoreColor = (score) => {
    const colors = {
      'A': '#00d084',
      'B': '#85cc00',
      'C': '#fbbf24',
      'D': '#fb923c',
      'E': '#ef4444'
    };
    return colors[score] || '#6b7280';
  };

  const grade = getHealthGrade(product.healthScore);
  const GradeIcon = grade.icon;

  return (
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
        {product.brands && (
          <p className="product-brand">{product.brands}</p>
        )}
      </div>

      {/* Health Score */}
      <motion.div 
        className="health-score-section"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <div className="score-circle" style={{ 
          background: `conic-gradient(${grade.color} ${product.healthScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
        }}>
          <div className="score-inner">
            <span className="score-value">{product.healthScore}</span>
            <span className="score-max">/100</span>
          </div>
        </div>
        <div className="score-label">
          <GradeIcon style={{ color: grade.color }} />
          <span style={{ color: grade.color }}>{grade.label}</span>
        </div>
      </motion.div>

      {/* Nutri-Score Badge */}
      {product.nutriScore && product.nutriScore !== 'N/A' && (
        <div className="nutri-score-badge">
          <span className="nutri-label">Nutri-Score</span>
          <div 
            className="nutri-score-value"
            style={{ 
              backgroundColor: getNutriScoreColor(product.nutriScore),
              boxShadow: `0 4px 12px ${getNutriScoreColor(product.nutriScore)}40`
            }}
          >
            {product.nutriScore}
          </div>
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
                <span className="nutrition-value">{product.nutritionData.energy} kcal</span>
              </div>
            )}
            {product.nutritionData.fat !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Fat</span>
                <span className="nutrition-value">{product.nutritionData.fat.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.saturatedFat !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Saturated Fat</span>
                <span className="nutrition-value">{product.nutritionData.saturatedFat.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.carbohydrates !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Carbs</span>
                <span className="nutrition-value">{product.nutritionData.carbohydrates.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.sugars !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Sugars</span>
                <span className="nutrition-value">{product.nutritionData.sugars.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.fiber !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Fiber</span>
                <span className="nutrition-value">{product.nutritionData.fiber.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.proteins !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Protein</span>
                <span className="nutrition-value">{product.nutritionData.proteins.toFixed(1)}g</span>
              </div>
            )}
            {product.nutritionData.salt !== undefined && (
              <div className="nutrition-item">
                <span className="nutrition-label">Salt</span>
                <span className="nutrition-value">{product.nutritionData.salt.toFixed(2)}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="additional-info">
        {product.additives > 0 && (
          <div className="info-badge warning">
            <FiAlertCircle />
            {product.additives} Additive{product.additives > 1 ? 's' : ''}
          </div>
        )}
        {product.novaGroup && (
          <div className={`info-badge ${product.novaGroup >= 3 ? 'warning' : 'success'}`}>
            NOVA Group {product.novaGroup}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
