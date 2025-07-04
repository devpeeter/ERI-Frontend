import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Building2, 
  User, 
  QrCode, 
  Package, 
  Shield, 
  FileText, 
  Upload,
  Eye,
  Gift,
  RotateCcw,
  X,
  Key
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: 'landing' | 'manufacturer' | 'user' | 'qr-scan';
  onPageChange: (page: 'landing' | 'manufacturer' | 'user' | 'qr-scan') => void;
  activeFeature: string;
  onFeatureChange: (feature: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentPage, 
  onPageChange, 
  activeFeature, 
  onFeatureChange 
}) => {
  const mainNavItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'manufacturer', label: 'Manufacturer', icon: Building2 },
    { id: 'user', label: 'User Dashboard', icon: User },
    { id: 'qr-scan', label: 'QR Scanner', icon: QrCode },
  ];

  const manufacturerFeatures = [
    { id: 'register-manufacturer', label: 'Register', icon: Building2 },
    { id: 'create-certificate', label: 'Create Certificate', icon: FileText },
    { id: 'verify-authenticity', label: 'Verify Authenticity', icon: Eye },
    { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
  ];

  const userFeatures = [
    { id: 'register-user', label: 'Register', icon: User },
    { id: 'my-items', label: 'My Items', icon: Package },
    { id: 'transfer-ownership', label: 'Transfer', icon: Gift },
    { id: 'claim-ownership', label: 'Claim Ownership', icon: Package },
    { id: 'revoke-code', label: 'Revoke Code', icon: RotateCcw },
    { id: 'verify-ownership', label: 'Verify', icon: Shield },
  ];

  const qrFeatures = [
    { id: 'claim-ownership', label: 'Claim Ownership', icon: Package },
    { id: 'verify-ownership', label: 'Verify Ownership', icon: Shield },
    { id: 'verify-authenticity', label: 'Verify Authenticity', icon: Eye },
  ];

  const handleNavClick = (id: string) => {
    if (['landing', 'manufacturer', 'user', 'qr-scan'].includes(id)) {
      onPageChange(id as any);
      onFeatureChange('');
    } else {
      onFeatureChange(id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-xl border-r border-green-500/20 z-50 overflow-y-auto"
          >
            <div className="p-4">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-green-400">Navigation</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation */}
              <div className="space-y-2 mb-8">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Main
                </h3>
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'text-gray-300 hover:text-green-400 hover:bg-green-500/10'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Manufacturer Features */}
              {currentPage === 'manufacturer' && (
                <div className="space-y-2 mb-8">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Manufacturer Tools
                  </h3>
                  {manufacturerFeatures.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
                          ${isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'text-gray-300 hover:text-green-400 hover:bg-green-500/10'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'}`} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* User Features */}
              {currentPage === 'user' && (
                <div className="space-y-2 mb-8">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    User Tools
                  </h3>
                  {userFeatures.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
                          ${isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'text-gray-300 hover:text-green-400 hover:bg-green-500/10'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'}`} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* QR Features */}
              {currentPage === 'qr-scan' && (
                <div className="space-y-2 mb-8">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    QR Actions
                  </h3>
                  {qrFeatures.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
                          ${isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'text-gray-300 hover:text-green-400 hover:bg-green-500/10'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'}`} />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-green-500/20 pt-4 mt-8">
                <p className="text-xs text-gray-500 text-center">
                  ERI Platform v1.0
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};