import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScanHistory, deleteScanHistory, fetchProduct } from '../redux/productSlice';
import { FiTrash2, FiClock, FiPackage } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './ScanHistory.css';

const ScanHistory = () => {
  const dispatch = useDispatch();
  const { scanHistory, historyLoading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchScanHistory());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (window.confirm('Delete this scan from history?')) {
      dispatch(deleteScanHistory(id));
    }
  };

  const handleViewProduct = (barcode) => {
    dispatch(fetchProduct(barcode));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getHealthColor = (score) => {
    if (score >= 75) return '#00d084';
    if (score >= 60) return '#4ade80';
    if (score >= 45) return '#fbbf24';
    if (score >= 30) return '#fb923c';
    return '#ef4444';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (historyLoading) {
    return (
      <div className="history-loading">
        <div className="loading-spinner"></div>
        <p>Loading history...</p>
      </div>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <div className="history-empty">
        <FiPackage />
        <h3>No scan history yet</h3>
        <p>Your scanned products will appear here</p>
      </div>
    );
  }

  return (
    <div className="scan-history">
      <div className="history-header">
        <FiClock />
        <h2>Scan History</h2>
        <span className="history-count">{scanHistory.length}</span>
      </div>

      <div className="history-list">
        {scanHistory.map((scan, index) => (
          <motion.div
            key={scan._id}
            className="history-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleViewProduct(scan.barcode)}
          >
            <div className="history-item-image">
              {scan.imageUrl ? (
                <img src={scan.imageUrl} alt={scan.productName} />
              ) : (
                <div className="history-item-placeholder">
                  <FiPackage />
                </div>
              )}
            </div>

            <div className="history-item-content">
              <div className="history-item-info">
                <h4 className="history-item-name">{scan.productName}</h4>
                {scan.brands && (
                  <p className="history-item-brand">{scan.brands}</p>
                )}
                <p className="history-item-time">{formatDate(scan.scannedAt)}</p>
              </div>

              <div className="history-item-score">
                <div 
                  className="score-badge"
                  style={{ 
                    backgroundColor: `${getHealthColor(scan.healthScore)}20`,
                    borderColor: getHealthColor(scan.healthScore),
                    color: getHealthColor(scan.healthScore)
                  }}
                >
                  {scan.healthScore}
                </div>
                {scan.nutriScore && scan.nutriScore !== 'N/A' && (
                  <div className="nutri-mini">{scan.nutriScore}</div>
                )}
              </div>
            </div>

            <button
              className="history-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(scan._id);
              }}
            >
              <FiTrash2 />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScanHistory;
