import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Package, Shield, Eye, AlertCircle, CheckCircle, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRScanner } from '../components/QRScanner';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { Certificate, ContractType } from '../types';
import { getContract, OWNERSHIP_ADDRESS, AUTHENTICITY_ADDRESS, stringToFelt252, felt252ToString, hex_it } from '../utils/blockchain';
import { handleError } from '../utils/errorParser';

export const QRScanPage: React.FC = () => {
  const { isDark } = useTheme();
  const { provider, account, address, isConnected, connectWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<'claim' | 'verify-ownership' | 'verify-authenticity' | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manufacturerName, setManufacturerName] = useState('');

  // Parse QR data on component mount if URL contains data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam);
        setQrData(decoded);
        handleParseQRData(decoded);
      } catch (error) {
        toast.error('Invalid QR data in URL');
      }
    }
  }, []);

  const handleParseQRData = (data?: string) => {
    const dataToUse = data || qrData;
    if (!dataToUse.trim()) {
      toast.error('Please enter QR data');
      return;
    }

    try {
      const parsed = JSON.parse(dataToUse);
      setParsedData(parsed);
      toast.success('QR data parsed successfully');
    } catch (error) {
      toast.error('Invalid QR data format');
    }
  };

  const handleQRScan = (data: string) => {
    setQrData(data);
    handleParseQRData(data);
    setShowScanner(false);
  };

  const handleClaimOwnership = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to claim ownership');
      connectWallet();
      return;
    }

    if (!parsedData?.cert) {
      toast.error('No certificate data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const cert: Certificate = parsedData.cert;
      const msgHash = parsedData.msgHash;

      const res = await contract.user_claim_ownership(cert, msgHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      toast.success(`Ownership claimed successfully for ${cert.name}`);
      setVerificationResult({
        type: 'claim',
        success: true,
        message: 'Ownership claimed successfully',
        data: cert
      });
    } catch (error: unknown) {
      handleError(error, 'Failed to claim ownership');
      setVerificationResult({
        type: 'claim',
        success: false,
        message: 'Failed to claim ownership'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOwnership = async () => {
    if (!parsedData?.cert) {
      toast.error('No certificate data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_ownership(stringToFelt252(parsedData.cert.id));

      console.log("Result: ", result);
      
      
      const ownershipDetails = {
        name: felt252ToString(result.name),
        item_id: felt252ToString(result.item_id),
        username: felt252ToString(result.username),
        owner: hex_it(result.owner)
      };

      setVerificationResult({
        type: 'ownership',
        success: true,
        message: 'Ownership verified successfully',
        data: ownershipDetails
      });
      toast.success('Ownership verified successfully');
    } catch (error: unknown) {
      handleError(error, 'Ownership verification failed');
      setVerificationResult({
        type: 'ownership',
        success: false,
        message: 'Ownership verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAuthenticity = async () => {
    if (!parsedData?.cert || !parsedData?.msgHash) {
      toast.error('No certificate or signature data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_authenticity(parsedData.cert, parsedData.msgHash);
      
      setVerificationResult({
        type: 'authenticity',
        success: result,
        message: result ? 'Product is authentic' : 'Product authenticity could not be verified',
        data: parsedData.cert
      });
      
      if (result) {
        toast.success('Product authenticity verified');
        
        let manufacturer = await contract.get_manufacturer(parsedData.cert.owner);
        setManufacturerName(felt252ToString(manufacturer.manufacturer_name));
        
      } else {
        toast.error('Product authenticity verification failed');
      }
    } catch (error: unknown) {
      handleError(error, 'Authenticity verification failed');
      setVerificationResult({
        type: 'authenticity',
        success: false,
        message: 'Authenticity verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: 'claim',
      title: 'Claim Ownership',
      description: 'Claim ownership of this product using the certificate data',
      icon: Package,
      requiresWallet: true,
      action: handleClaimOwnership
    },
    {
      id: 'verify-ownership',
      title: 'Verify Ownership',
      description: 'Check who currently owns this product',
      icon: Shield,
      requiresWallet: false,
      action: handleVerifyOwnership
    },
    {
      id: 'verify-authenticity',
      title: 'Verify Authenticity',
      description: 'Verify that this product is authentic using blockchain signatures',
      icon: Eye,
      requiresWallet: false,
      action: handleVerifyAuthenticity
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent ${
              isDark 
                ? 'from-green-400 to-emerald-400' 
                : 'from-green-600 to-emerald-600'
            }`}>
              QR Code Scanner
            </h1>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Scan or paste QR code data to verify products and manage ownership
            </p>
          </div>

          {/* QR Data Input */}
          <Card className="mb-8">
            <div className="mb-6">
              <QrCode className={`w-8 h-8 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Enter QR Code Data
              </h2>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Scan a QR code with your camera or paste the data manually
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowScanner(true)}
                  variant="primary"
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button
                  onClick={() => handleParseQRData()}
                  variant="outline"
                  disabled={!qrData.trim()}
                >
                  Parse Data
                </Button>
              </div>
              
              <Input
                placeholder="Or paste QR code data here..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
              />
            </div>

            {parsedData && (
              <div className={`mt-6 p-4 rounded-xl border ${
                isDark 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    QR Data Parsed Successfully
                  </span>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p><strong>Product:</strong> {parsedData.cert?.name || 'Unknown'}</p>
                  <p><strong>ID:</strong> {parsedData.cert?.id || 'Unknown'}</p>
                  <p><strong>Serial:</strong> {parsedData.cert?.serial || 'Unknown'}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Action Selection */}
          {parsedData && (
            <Card className="mb-8">
              <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Choose an Action
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(action.id as any)}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 text-left
                        ${isSelected 
                          ? isDark
                            ? 'border-green-500 bg-green-500/10' 
                            : 'border-green-600 bg-green-600/10'
                          : isDark
                            ? 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5'
                            : 'border-green-600/20 hover:border-green-600/40 hover:bg-green-600/5'
                        }
                      `}
                    >
                      <Icon className={`w-6 h-6 mb-3 ${
                        isSelected 
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {action.title}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {action.description}
                      </p>
                      {action.requiresWallet && !isConnected && (
                        <div className={`flex items-center mt-2 text-xs ${
                          isDark ? 'text-amber-400' : 'text-amber-600'
                        }`}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Requires wallet connection
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAction && (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      const action = actions.find(a => a.id === selectedAction);
                      if (action) {
                        if (action.requiresWallet && !isConnected) {
                          connectWallet();
                        } else {
                          action.action();
                        }
                      }
                    }}
                    loading={loading}
                    className="w-full"
                  >
                    {(() => {
                      const action = actions.find(a => a.id === selectedAction);
                      if (action?.requiresWallet && !isConnected) {
                        return 'Connect Wallet to Continue';
                      }
                      return action?.title || 'Execute Action';
                    })()}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Verification Results */}
          {verificationResult && (
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                {verificationResult.success ? (
                  <CheckCircle className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                ) : (
                  <AlertCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                )}
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Verification Results
                </h3>
              </div>

              <div className={`p-4 rounded-xl border ${
                verificationResult.success 
                  ? isDark
                    ? 'border-green-500/30 bg-green-500/10' 
                    : 'border-green-200 bg-green-50'
                  : isDark
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-red-200 bg-red-50'
              }`}>
                <p className={`font-medium mb-3 ${
                  verificationResult.success 
                    ? isDark ? 'text-green-300' : 'text-green-700'
                    : isDark ? 'text-red-300' : 'text-red-700'
                }`}>
                  {verificationResult.message}
                </p>

                {verificationResult.data && (
                  <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {verificationResult.type === 'ownership' && (
                      <>
                        <p><strong>Item Name:</strong> {verificationResult.data.name}</p>
                        <p><strong>Item ID:</strong> {verificationResult.data.item_id}</p>
                        <p><strong>Owner Username:</strong> {verificationResult.data.username}</p>
                        <p><strong>Owner Address:</strong> {verificationResult.data.owner}</p>
                      </>
                    )}
                    
                    {(verificationResult.type === 'authenticity' || verificationResult.type === 'claim') && (
                      <>
                        <p><strong>Product Name:</strong> {verificationResult.data.name}</p>
                        <p><strong>Product ID:</strong> {verificationResult.data.id}</p>
                        <p><strong>Serial Number:</strong> {verificationResult.data.serial}</p>
                        <p><strong>Manufacturing Date:</strong> {new Date(parseInt(verificationResult.data.date) * 1000).toLocaleDateString()}</p>
                        <p><strong>Manufacturer:</strong> {manufacturerName}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {loading && <LoadingSpinner />}
        </motion.div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};