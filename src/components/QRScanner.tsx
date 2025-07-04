import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Upload, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useTheme } from '../contexts/ThemeContext';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const { isDark } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Start scanning for QR codes
        startQRDetection();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please check your camera permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const detectQR = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && isScanning) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log('QR Code detected:', code.data);
          onScan(code.data);
          stopCamera();
          return;
        }
      }
    };

    // Scan every 100ms for better performance
    scanIntervalRef.current = window.setInterval(detectQR, 100);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              console.log('QR Code detected from image:', code.data);
              onScan(code.data);
            } else {
              setError('No QR code found in the uploaded image. Please try a clearer image.');
            }
          }
        }
      };
      img.onerror = () => {
        setError('Failed to load the image. Please try another file.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            QR Code Scanner
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className={`p-4 rounded-xl mb-4 flex items-start space-x-3 ${
            isDark 
              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {!isScanning ? (
            <>
              <Button
                onClick={startCamera}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
              
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="text-sm">or</span>
              </div>
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-upload"
                />
                <label htmlFor="qr-upload">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => document.getElementById('qr-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload QR Image
                  </Button>
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-xl"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none">
                  {/* Corner indicators */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-green-500 animate-pulse"></div>
                </div>
              </div>
              
              <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Position the QR code within the frame. Detection is automatic.
              </p>
              
              <Button
                onClick={stopCamera}
                variant="secondary"
                className="w-full"
              >
                Stop Scanning
              </Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        
        <div className={`mt-6 p-4 rounded-xl border ${
          isDark 
            ? 'bg-blue-500/10 border-blue-500/30' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            💡 <strong>Tips:</strong> Ensure good lighting and hold the camera steady. For uploaded images, make sure the QR code is clear and well-lit.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};