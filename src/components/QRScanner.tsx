import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Upload } from 'lucide-react';
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
        videoRef.current.play();
        
        // Start scanning for QR codes
        scanForQRCode();
      }
    } catch (err) {
      setError('Camera access denied or not available');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple QR code detection (in a real app, you'd use a library like jsQR)
        // For now, we'll simulate detection after a few seconds
        setTimeout(() => {
          // This is a placeholder - in reality you'd use a QR code detection library
          const mockQRData = '{"cert":{"name":"Sample Product","id":"12345","serial":"ABC123","date":"1640995200","owner":"0x123...","metadata":["electronics","warranty"]},"msgHash":"0xabc123..."}';
          onScan(mockQRData);
          stopCamera();
        }, 3000);
      }

      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
            
            // Simulate QR code detection from image
            setTimeout(() => {
              const mockQRData = '{"cert":{"name":"Sample Product","id":"12345","serial":"ABC123","date":"1640995200","owner":"0x123...","metadata":["electronics","warranty"]},"msgHash":"0xabc123..."}';
              onScan(mockQRData);
            }, 1000);
          }
        }
      };
      img.src = e.target?.result as string;
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
          <div className={`p-4 rounded-xl mb-4 ${
            isDark 
              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {error}
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
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                </div>
              </div>
              
              <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Position the QR code within the frame
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
      </Card>
    </motion.div>
  );
};