import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useDispatch } from 'react-redux';
import { fetchProduct, saveScanHistory } from '../redux/productSlice';
import { FiCamera, FiX } from 'react-icons/fi';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onClose }) => {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 280, height: 140 },
      aspectRatio: 1.0,
      formatsToSupport: [
        0, // EAN_13
        1, // EAN_8
        2, // UPC_A
        3, // UPC_E
      ],
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'barcode-reader',
      config,
      false
    );

    html5QrcodeScanner.render(
      async (decodedText) => {
        // Success callback
        console.log('Barcode scanned:', decodedText);
        
        // Fetch product data
        const result = await dispatch(fetchProduct(decodedText));
        
        if (result.payload && !result.error) {
          // Save to history
          dispatch(saveScanHistory(result.payload));
        }
        
        // Stop scanning and close
        html5QrcodeScanner.clear();
        onClose();
      },
      (error) => {
        // Error callback (can be ignored for scanning failures)
        console.debug('Scan error:', error);
      }
    );

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [dispatch, onClose]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
    }
    onClose();
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <div className="scanner-title">
            <FiCamera className="scanner-icon" />
            <h2>Scan Barcode</h2>
          </div>
          <button className="scanner-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>
        <div className="scanner-content">
          <div id="barcode-reader" ref={scannerRef}></div>
          <p className="scanner-hint">Position the barcode within the frame</p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
