import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearProduct, clearError } from "../redux/productSlice";
import BarcodeScanner from "../components/BarcodeScanner";
import ProductCard from "../components/ProductCard";
import ScanHistory from "../components/ScanHistory";
import AIAnalysis from "../components/AIAnalysis"; // IMPORT THIS!
import { FiCamera, FiX, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { MdOutlineScience } from "react-icons/md";
import "./Home.css";

const Home = () => {
  const [showScanner, setShowScanner] = useState(false);
  // State for the AI Modal
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const { currentProduct, loading, error } = useSelector(
    (state) => state.product,
  );
  const dispatch = useDispatch();

  const handleCloseError = () => {
    dispatch(clearError());
  };

  const handleClearProduct = () => {
    dispatch(clearProduct());
  };

  // Check if current product has ingredients for AI analysis
  // We check if ingredients is a non-empty string or array
  const canAnalyze =
    currentProduct?.ingredients && currentProduct.ingredients.length;

  return (
    <div className="home">
      <header className="app-header">
        <div className="header-content">
          <motion.div
            className="header-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="logo">
              <div className="logo-icon">
                <span className="logo-scan-line"></span>
              </div>
              <h1>NutriScan</h1>
            </div>
            <p className="tagline">
              Instant nutrition insights at your fingertips
            </p>
          </motion.div>
        </div>
      </header>

      <main className="main-content">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="error-content">
                <FiAlertCircle />
                <p>{error.message || error.error || "An error occurred"}</p>
              </div>
              <button onClick={handleCloseError} className="error-close">
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Button (Show only when no product is loaded) */}
        {!currentProduct && !loading && (
          <motion.div
            className="scan-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              className="scan-button"
              onClick={() => setShowScanner(true)}
            >
              <div className="scan-button-content">
                <FiCamera />
                <span>Scan Barcode</span>
              </div>
              <div className="scan-button-glow"></div>
            </button>
            <p className="scan-hint">
              Tap to scan a product barcode and get instant health insights
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            className="loading-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading-spinner-large"></div>
            <p>Analyzing product...</p>
          </motion.div>
        )}

        {/* Product Card & Actions (Success State) */}
        <AnimatePresence>
          {currentProduct && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="product-actions">
                <button
                  className="action-button primary"
                  onClick={() => setShowScanner(true)}
                >
                  <FiCamera />
                  Scan Another
                </button>

                {/* --- AI BUTTON MOVED HERE --- */}
                {canAnalyze && (
                  <button
                    className="action-button ai-button"
                    onClick={() => setShowAIAnalysis(true)}
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                      color: "white",
                      border: "none",
                    }}
                  >
                    <MdOutlineScience size={20} />
                    AI Analysis
                  </button>
                )}

                <button
                  className="action-button secondary"
                  onClick={handleClearProduct}
                >
                  <FiX />
                  Clear
                </button>
              </div>

              <ProductCard product={currentProduct} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan History */}
        {!currentProduct && !loading && <ScanHistory />}
      </main>

      <footer className="app-footer">
        <p>
          Data powered by{" "}
          <a
            href="https://world.openfoodfacts.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Food Facts
          </a>
        </p>
      </footer>

      {/* --- MODALS --- */}
      {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} />}

      {/* AI Analysis Modal - ADDED THIS */}
      {showAIAnalysis && currentProduct && (
        <AIAnalysis
          product={currentProduct}
          onClose={() => setShowAIAnalysis(false)}
        />
      )}
    </div>
  );
};

export default Home;
