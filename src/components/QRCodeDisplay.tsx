import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface QRCodeDisplayProps {
  data: string;
  label: string;
  itemId?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ data, label, itemId }) => {
  const downloadQRCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `certificate-qr-${itemId || 'unknown'}.png`;
      link.click();
    }
  };

  // Create QR scan URL that works with the current routing system
  const qrScanUrl = `${window.location.origin}?page=qr-scan&data=${encodeURIComponent(data)}`;

  return (
    <Card className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">
            {label}
          </h3>
        </div>
        
        <div className="relative inline-block p-4 bg-white rounded-xl shadow-inner">
          <QRCodeCanvas
            value={qrScanUrl}
            size={300}
            fgColor="#059669"
            bgColor="#ffffff"
            level="M"
            className="rounded-lg"
          />
        </div>

        <p className="mt-4 text-sm text-gray-300 mb-4">
          Scan to verify product authenticity and ownership
        </p>

        <div className="space-y-2">
          <Button
            onClick={downloadQRCode}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
          
          <p className="text-xs text-gray-400">
            QR code contains verification URL for easy scanning
          </p>
        </div>
      </motion.div>
    </Card>
  );
};