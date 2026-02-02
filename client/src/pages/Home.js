import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearProduct, clearError } from '../redux/productSlice';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductCard from '../components/ProductCard';
import ScanHistory from '../components/ScanHistory';
import { FiCamera, FiX, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Home.css';

const Home = () => {
  const [showScanner, setShowScanner] = useState(false);
  const { currentProduct, loading, error } = useSelector((state) => state.product);
  const dispatch = useDispatch();

  const handleCloseError = () => {
    dispatch(clearError());
  };

  const handleClearProduct = () => {
    dispatch(clearProduct());
  };

  return (
    <div className="home">
      {/* Header */}
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
            <p className="tagline">Instant nutrition insights at your fingertips</p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
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
                <p>{error.message || error.error || 'An error occurred'}</p>
              </div>
              <button onClick={handleCloseError} className="error-close">
                <FiX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Button */}
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
            <p className="scan-hint">Tap to scan a product barcode and get instant health insights</p>
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

        {/* Product Card */}
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

      {/* Footer */}
      <footer className="app-footer">
        <p>Data powered by <a href="https://world.openfoodfacts.org/" target="_blank" rel="noopener noreferrer">Open Food Facts</a></p>
      </footer>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Home;
