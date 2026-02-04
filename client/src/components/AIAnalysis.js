// src/components/AIAnalysis.jsx
import React, { useState, useEffect } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiLoader,
  FiShield,
  FiAlertCircle,
  FiHeart,
  FiActivity,
  FiUsers,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import { analyzeProductIngredients } from "../services/geminiService";
import "./AIAnalysis.css";

const AIAnalysis = ({ product, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, personalized, detailed

  useEffect(() => {
    const analyzeProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await analyzeProductIngredients(product);

        if (result.success) {
          setAnalysis(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to analyze product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (product && product.ingredients) {
      analyzeProduct();
    } else {
      setError("Product ingredients not available for analysis");
      setLoading(false);
    }
  }, [product]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 70) return "Healthy";
    if (score >= 40) return "Moderate";
    return "Unhealthy";
  };

  if (loading) {
    return (
      <div className="ai-analysis-overlay">
        <div className="ai-analysis-container">
          <header className="analysis-header">
            <div className="header-title">
              <FiShield size={24} />
              <h2>AI Ingredient Analysis</h2>
            </div>
            <button className="close-btn-analysis" onClick={onClose}>
              <FiX />
            </button>
          </header>

          <div className="analysis-content loading-content">
            <div className="loading-wrapper">
              <FiLoader className="loader-spin" size={48} />
              <p>Analyzing ingredients with AI...</p>
              <p className="loading-subtext">
                Running professional analysis on {product.productName}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-analysis-overlay">
        <div className="ai-analysis-container">
          <header className="analysis-header">
            <div className="header-title">
              <FiShield size={24} />
              <h2>AI Ingredient Analysis</h2>
            </div>
            <button className="close-btn-analysis" onClick={onClose}>
              <FiX />
            </button>
          </header>

          <div className="analysis-content error-content">
            <div className="error-wrapper">
              <FiAlertCircle size={48} color="#ef4444" />
              <h3>Analysis Failed</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const scorePercentage = analysis.healthScore / 100;
  const strokeDashoffset = circumference * (1 - scorePercentage);

  return (
    <div className="ai-analysis-overlay">
      <div className="ai-analysis-container">
        <header className="analysis-header">
          <div className="header-title">
            <FiShield size={24} />
            <h2>Professional Analysis</h2>
          </div>
          <button className="close-btn-analysis" onClick={onClose}>
            <FiX />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiInfo size={18} />
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "personalized" ? "active" : ""}`}
            onClick={() => setActiveTab("personalized")}
          >
            <FiUsers size={18} />
            For You
          </button>
          <button
            className={`tab-btn ${activeTab === "detailed" ? "active" : ""}`}
            onClick={() => setActiveTab("detailed")}
          >
            <FiActivity size={18} />
            Detailed
          </button>
        </div>

        <div className="analysis-content">
          {/* Health Score */}
          <div className="health-score-section">
            <div className="score-circle-container">
              <svg
                className="score-circle"
                viewBox="0 0 120 120"
                preserveAspectRatio="xMidYMid meet"
              >
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={getHealthScoreColor(analysis.healthScore)}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  className="score-progress-circle"
                />
              </svg>
              <div className="score-text">
                <span className="score-number">{analysis.healthScore}</span>
                <span className="score-label">
                  {getHealthScoreLabel(analysis.healthScore)}
                </span>
              </div>
            </div>
            <p className="overall-assessment">{analysis.overallAssessment}</p>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              {/* Bottom Line */}
              {analysis.bottomLine && (
                <section className="analysis-section bottomline-section">
                  <div className="bottomline-card">
                    <h3 className="bottom-text">
                      <FiCheckCircle color="#ffffffff" />
                      Bottom Line
                    </h3>
                    <p className="bottomline-text">{analysis.bottomLine}</p>
                  </div>
                </section>
              )}

              {/* Harmful Ingredients */}
              {analysis.harmfulIngredients &&
                analysis.harmfulIngredients.length > 0 && (
                  <section className="analysis-section harmful-section">
                    <h3>
                      <FiAlertTriangle color="#ef4444" />
                      Harmful Ingredients ({analysis.harmfulIngredients.length})
                    </h3>
                    <div className="ingredients-list">
                      {analysis.harmfulIngredients.map((ingredient, index) => (
                        <div key={index} className="ingredient-card harmful">
                          <div className="ingredient-header">
                            <h4>{ingredient.name}</h4>
                            <span
                              className="risk-badge"
                              style={{
                                backgroundColor: getRiskColor(
                                  ingredient.riskLevel,
                                ),
                              }}
                            >
                              {ingredient.riskLevel} risk
                            </span>
                          </div>
                          <p className="ingredient-type">{ingredient.type}</p>
                          <p className="health-concern">
                            {ingredient.healthConcerns}
                          </p>
                          {ingredient.alternativeSuggestion && (
                            <p className="alternative">
                              <strong>Better alternative:</strong>{" "}
                              {ingredient.alternativeSuggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Beneficial Ingredients */}
              {analysis.beneficialIngredients &&
                analysis.beneficialIngredients.length > 0 && (
                  <section className="analysis-section beneficial-section">
                    <h3>
                      <FiCheckCircle color="#10b981" />
                      Beneficial Ingredients
                    </h3>
                    <div className="ingredients-list">
                      {analysis.beneficialIngredients.map(
                        (ingredient, index) => (
                          <div
                            key={index}
                            className="ingredient-card beneficial"
                          >
                            <h4>{ingredient.name}</h4>
                            <p>{ingredient.benefit}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}

              {/* Allergen Alerts */}
              {analysis.allergenAlert && analysis.allergenAlert.length > 0 && (
                <section className="analysis-section allergen-section">
                  <h3>
                    <FiAlertCircle color="#f59e0b" />
                    Allergen Alert
                  </h3>
                  <div className="alert-tags">
                    {analysis.allergenAlert.map((allergen, index) => (
                      <span key={index} className="allergen-tag">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Warnings */}
              {analysis.warnings && analysis.warnings.length > 0 && (
                <section className="analysis-section warnings-section">
                  <h3>
                    <FiInfo color="#3b82f6" />
                    Important Warnings
                  </h3>
                  <ul className="warnings-list">
                    {analysis.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Recommendations */}
              {analysis.recommendations &&
                analysis.recommendations.length > 0 && (
                  <section className="analysis-section recommendations-section">
                    <h3>
                      <FiCheckCircle color="#10b981" />
                      Professional Recommendations
                    </h3>
                    <ul className="recommendations-list">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </section>
                )}
            </>
          )}

          {/* PERSONALIZED TAB */}
          {activeTab === "personalized" &&
            analysis.personalizedRecommendations && (
              <div className="personalized-content">
                {analysis.personalizedRecommendations.forDiabetics && (
                  <div className="personal-card diabetic">
                    <h4>
                      <FiActivity /> For Diabetics
                    </h4>
                    <p>{analysis.personalizedRecommendations.forDiabetics}</p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forWeightLoss && (
                  <div className="personal-card weightloss">
                    <h4>
                      <FiTrendingDown /> For Weight Loss (Cutting)
                    </h4>
                    <p>{analysis.personalizedRecommendations.forWeightLoss}</p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forMuscleBuilding && (
                  <div className="personal-card bulking">
                    <h4>
                      <FiTrendingUp /> For Muscle Building (Bulking)
                    </h4>
                    <p>
                      {analysis.personalizedRecommendations.forMuscleBuilding}
                    </p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forHeartHealth && (
                  <div className="personal-card heart">
                    <h4>
                      <FiHeart /> For Heart Health
                    </h4>
                    <p>{analysis.personalizedRecommendations.forHeartHealth}</p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forKids && (
                  <div className="personal-card kids">
                    <h4>
                      <FiUsers /> For Children
                    </h4>
                    <p>{analysis.personalizedRecommendations.forKids}</p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forPregnancy && (
                  <div className="personal-card pregnancy">
                    <h4>
                      <FiHeart /> For Pregnancy
                    </h4>
                    <p>{analysis.personalizedRecommendations.forPregnancy}</p>
                  </div>
                )}

                {analysis.personalizedRecommendations.forSeniors && (
                  <div className="personal-card seniors">
                    <h4>
                      <FiUsers /> For Seniors
                    </h4>
                    <p>{analysis.personalizedRecommendations.forSeniors}</p>
                  </div>
                )}
              </div>
            )}

          {/* DETAILED TAB */}
          {activeTab === "detailed" && (
            <>
              {/* Preservatives */}
              {analysis.preservatives && analysis.preservatives.length > 0 && (
                <section className="analysis-section preservatives-section">
                  <h3>
                    <FiAlertCircle color="#f59e0b" />
                    Preservatives Analysis
                  </h3>
                  <div className="preservatives-list">
                    {analysis.preservatives.map((preservative, index) => (
                      <div key={index} className="preservative-card">
                        <h4>{preservative.name}</h4>
                        <p className="preservative-purpose">
                          <strong>Purpose:</strong> {preservative.purpose}
                        </p>
                        <p className="preservative-safety">
                          <strong>Safety:</strong> {preservative.safetyLevel}
                        </p>
                        {preservative.concerns && (
                          <p className="preservative-concerns">
                            <strong>Concerns:</strong> {preservative.concerns}
                          </p>
                        )}
                        {preservative.naturalAlternatives && (
                          <p className="preservative-alternatives">
                            <strong>Natural Alternatives:</strong>{" "}
                            {preservative.naturalAlternatives}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Nutritional Concerns */}
              {analysis.nutritionalConcerns &&
                analysis.nutritionalConcerns.length > 0 && (
                  <section className="analysis-section">
                    <h3>
                      <FiActivity color="#ef4444" />
                      Nutritional Concerns
                    </h3>
                    <ul className="concerns-list">
                      {analysis.nutritionalConcerns.map((concern, index) => (
                        <li key={index}>{concern}</li>
                      ))}
                    </ul>
                  </section>
                )}

              {/* Processing Level */}
              {analysis.processingLevel && (
                <section className="analysis-section processing-section">
                  <h3>
                    <FiInfo color="#6366f1" />
                    Processing Level
                  </h3>
                  <div className="processing-card">
                    <p className="nova-group">
                      <strong>NOVA Group:</strong>{" "}
                      {analysis.processingLevel.novaGroup}
                    </p>
                    <p>{analysis.processingLevel.explanation}</p>
                    {analysis.processingLevel.minimumProcessingAlternatives && (
                      <p className="alternatives">
                        <strong>Less Processed Alternatives:</strong>{" "}
                        {analysis.processingLevel.minimumProcessingAlternatives}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Environmental Note */}
              {analysis.environmentalAndEthicalNotes && (
                <section className="analysis-section environmental-section">
                  <h3>
                    <FiShield color="#10b981" />
                    Environmental & Ethical Notes
                  </h3>
                  <p>{analysis.environmentalAndEthicalNotes}</p>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="analysis-footer">
          <p className="ai-disclaimer">
            ⚡ Professional Analysis by Gemini AI • For informational purposes
            only • Consult healthcare professionals for medical advice
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AIAnalysis;
