import React, { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useDispatch } from "react-redux";
import { fetchProduct, saveScanHistory } from "../redux/productSlice";
import { FiCamera, FiX, FiLoader, FiAlertCircle } from "react-icons/fi";
import "./BarcodeScanner.css";

const BarcodeScanner = ({ onClose }) => {
  const scannerRef = useRef(null);
  const dispatch = useDispatch();

  // State for UI rendering
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Ref to track processing status without triggering useEffect restarts
  const isProcessingRef = useRef(false);

  // Helper function to update both state (for UI) and Ref (for logic)
  const setProcessingStatus = (status) => {
    isProcessingRef.current = status;
    setIsProcessing(status);
  };

  const stopScannerHardware = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Scanner stop warning:", err);
      }
    }
  };

  const handleClose = useCallback(async () => {
    await stopScannerHardware();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("barcode-reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const config = {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Responsive calculation
            const dynamicWidth = viewfinderWidth * 0.75;
            const dynamicHeight =
              viewfinderWidth < 600 ? dynamicWidth * 0.5 : 180;

            // FIX: Guaranteed minimum size to prevent 50px crash
            return {
              width: Math.max(100, Math.floor(dynamicWidth)),
              height: Math.max(60, Math.floor(dynamicHeight)),
            };
          },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "user" },
          config,
          async (decodedText) => {
            // 2. Access the status via Ref to avoid ESLint dependency warnings
            if (isProcessingRef.current) return;

            setProcessingStatus(true);
            setErrorMessage("");

            // Stop hardware immediately for a professional "frozen" effect
            await stopScannerHardware();

            try {
              const result = await dispatch(fetchProduct(decodedText)).unwrap();
              await dispatch(saveScanHistory(result)).unwrap();
              onClose();
            } catch (err) {
              setProcessingStatus(false);
              setErrorMessage(`Barcode ${decodedText} not found.`);
              // Automatically restart camera after 2 seconds so user can try again
              setTimeout(startScanner, 2000);
            }
          },
        );
      } catch (err) {
        setErrorMessage("Camera access denied or hardware error.");
        console.error(err);
      }
    };

    // Small delay to ensure modal transition finishes
    const timeoutId = setTimeout(startScanner, 500);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // 3. Dependency array is now clean. isProcessingRef doesn't need to be here.
  }, [dispatch, onClose]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <header className="scanner-header">
          <div className="scanner-title-group">
            {isProcessing ? (
              <FiLoader className="spin-loader" />
            ) : (
              <FiCamera className="cam-icon" />
            )}
            <h2>{isProcessing ? "Analyzing..." : "Ready to Scan"}</h2>
          </div>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Close scanner"
          >
            <FiX />
          </button>
        </header>

        <main className="scanner-main">
          <div id="barcode-reader"></div>

          {/* Responsive Frame */}
          <div
            className={`scan-frame-ui ${isProcessing ? "is-processing" : ""}`}
          >
            <div className="laser-line"></div>
          </div>

          {errorMessage && (
            <div className="error-toast-mobile">
              <FiAlertCircle /> <span>{errorMessage}</span>
            </div>
          )}
        </main>

        <footer className="scanner-footer">
          <p>
            {isProcessing
              ? "Fetching nutrition details..."
              : "Position the barcode within the center frame"}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default BarcodeScanner;
