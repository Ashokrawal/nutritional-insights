import React, { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useDispatch } from "react-redux";
import { fetchProduct, saveScanHistory } from "../redux/productSlice";
import { FiCamera, FiX, FiLoader, FiAlertCircle } from "react-icons/fi";
import "./BarcodeScanner.css";

// Html5Qrcode scanner states
const SCANNING_STATE = 2;

const BarcodeScanner = ({ onClose }) => {
  const scannerRef = useRef(null);
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  // State for UI rendering
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Ref to track processing status without triggering useEffect restarts
  const isProcessingRef = useRef(false);

  // Helper function to update both state (for UI) and Ref (for logic)
  const setProcessingStatus = useCallback((status) => {
    if (!isMountedRef.current) return;
    isProcessingRef.current = status;
    setIsProcessing(status);
  }, []);

  // ENHANCED: Aggressive camera cleanup that actually works
  const stopScannerHardware = useCallback(async () => {
    if (isCleaningUpRef.current) return; // Prevent multiple cleanup calls
    isCleaningUpRef.current = true;

    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // First, suppress video abort errors by adding event listener
    const videoElements = document.querySelectorAll("#barcode-reader video");
    videoElements.forEach((video) => {
      video.onerror = null; // Remove error handler
      video.onabort = null; // Remove abort handler
    });

    if (scannerRef.current) {
      try {
        // Try to get state gracefully
        const state = await scannerRef.current.getState().catch(() => null);

        if (state === SCANNING_STATE || state === Html5Qrcode.SCANNING) {
          // SCANNING state
          try {
            await scannerRef.current.stop();
            // Small pause after stop to let library clean up
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (stopErr) {
            // Ignore stop errors - we'll clean up manually
            console.debug("Scanner stop:", stopErr.message || stopErr);
          }
        }

        // Always call clear to release camera
        try {
          await scannerRef.current.clear();
        } catch (clearErr) {
          // Ignore clear errors
          console.debug("Scanner clear:", clearErr.message || clearErr);
        }
      } catch (err) {
        console.debug("Scanner cleanup:", err.message || err);
      }
    }

    // CRITICAL: Manually stop all video tracks as a failsafe
    // This runs even if the library cleanup fails
    try {
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((video) => {
        // Remove error handlers before stopping
        video.onerror = null;
        video.onabort = null;

        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach((track) => {
            if (track.readyState === "live") {
              track.stop();
            }
          });
          video.srcObject = null;
        }

        // Pause and remove src
        video.pause();
        video.src = "";
        video.load();
      });
    } catch (e) {
      console.debug("Manual track cleanup:", e.message || e);
    }

    // Clean up DOM - small delay to prevent abort error
    await new Promise((resolve) => setTimeout(resolve, 100));
    const container = document.getElementById("barcode-reader");
    if (container) {
      container.innerHTML = "";
    }

    isCleaningUpRef.current = false;
  }, []);

  // Enhanced close handler with guaranteed cleanup
  const handleClose = useCallback(async () => {
    isMountedRef.current = false;

    // CRITICAL: Wait for cleanup to complete before calling onClose
    await stopScannerHardware();

    // Reduced delay since stopScannerHardware now has its own delays
    await new Promise((resolve) => setTimeout(resolve, 100));

    onClose();
  }, [onClose, stopScannerHardware]);

  // Start scanner with enhanced error handling
  const startScanner = useCallback(async () => {
    if (!scannerRef.current || !isMountedRef.current) return;

    try {
      const config = {
        fps: 20,
        qrbox: (w, h) => ({
          width: Math.max(150, Math.floor(w * 0.7)),
          height: Math.max(100, Math.floor(h * 0.4)),
        }),
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Prevent double processing
          if (isProcessingRef.current || !isMountedRef.current) return;

          setProcessingStatus(true);
          setErrorMessage("");

          try {
            const product = await dispatch(fetchProduct(decodedText)).unwrap();

            // Validate product data
            if (product && product.productName) {
              await dispatch(saveScanHistory(product)).unwrap();

              // CRITICAL FIX: Stop camera BEFORE closing
              if (isMountedRef.current) {
                await stopScannerHardware();
                // Small delay to ensure camera is fully released
                await new Promise((resolve) => setTimeout(resolve, 300));
                onClose();
              }
            } else {
              throw new Error("Product data incomplete");
            }
          } catch (err) {
            if (!isMountedRef.current) return;

            setProcessingStatus(false);

            const friendlyError =
              err.message === "Product data incomplete"
                ? "Product not found in database"
                : err.error || "Unable to fetch product details";

            setErrorMessage(`${friendlyError}. Retrying...`);

            // Restart scanner after delay
            retryTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                startScanner();
              }
            }, 2500);
          }
        },
        (errorMessage) => {
          // Optional: handle scan errors
          console.debug("Scan frame error:", errorMessage);
        },
      );
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error("Camera initialization error:", err);

      // Specific error messages based on error type
      let errorMsg = "Camera access failed";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMsg = "Camera permission denied. Please enable camera access.";
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is in use by another application.";
      } else if (err.name === "OverconstrainedError") {
        errorMsg = "Camera constraints not supported.";
      }

      setErrorMessage(errorMsg);

      // Retry with front camera as fallback (only if not a permission issue)
      if (
        err.name !== "NotAllowedError" &&
        err.name !== "PermissionDeniedError"
      ) {
        retryTimeoutRef.current = setTimeout(async () => {
          if (!isMountedRef.current) return;

          try {
            await scannerRef.current.start(
              { facingMode: "user" }, // Try front camera
              {
                fps: 20,
                qrbox: (w, h) => ({
                  width: Math.max(150, Math.floor(w * 0.7)),
                  height: Math.max(100, Math.floor(h * 0.4)),
                }),
              },
              async (decodedText) => {
                if (isProcessingRef.current || !isMountedRef.current) return;
                setProcessingStatus(true);
                setErrorMessage("");

                try {
                  const product = await dispatch(
                    fetchProduct(decodedText),
                  ).unwrap();
                  if (product && product.productName) {
                    await dispatch(saveScanHistory(product)).unwrap();
                    if (isMountedRef.current) {
                      await stopScannerHardware();
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      onClose();
                    }
                  } else {
                    throw new Error("Product data incomplete");
                  }
                } catch (err) {
                  if (!isMountedRef.current) return;
                  setProcessingStatus(false);
                  setErrorMessage("Product not found. Retrying...");
                  retryTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) startScanner();
                  }, 2500);
                }
              },
            );
            setErrorMessage("Using front camera...");
          } catch (fallbackErr) {
            if (isMountedRef.current) {
              setErrorMessage("Unable to access any camera.");
            }
          }
        }, 3000);
      }
    }
  }, [dispatch, onClose, setProcessingStatus, stopScannerHardware]);

  // Initialize scanner on mount
  useEffect(() => {
    isMountedRef.current = true;
    scannerRef.current = new Html5Qrcode("barcode-reader");

    // Suppress video abort errors that occur during cleanup
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMsg = args[0]?.toString() || "";
      // Filter out the html5-qrcode video abort errors
      if (
        errorMsg.includes("video surface onabort") ||
        errorMsg.includes("RenderedCameraImpl")
      ) {
        return; // Suppress this specific error
      }
      originalConsoleError(...args);
    };

    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        startScanner();
      }
    }, 500);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);

      // Restore console.error
      console.error = originalConsoleError;

      // Synchronous cleanup that runs immediately
      (async () => {
        await stopScannerHardware();
      })();
    };
  }, [startScanner, stopScannerHardware]);

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
