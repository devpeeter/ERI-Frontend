import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sun, Moon, Menu, X, Building2, User, QrCode, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/Button';
import { NotificationBell } from './NotificationBell';

interface NavigationProps {
  currentPage: 'landing' | 'manufacturer' | 'user' | 'qr-scan';
  onPageChange: (page: 'landing' | 'manufacturer' | 'user' | 'qr-scan') => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  onToggleSidebar,
  showSidebarToggle = false 
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWalletClick = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const navigationItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'manufacturer', label: 'For Manufacturers', icon: Building2 },
    { id: 'user', label: 'For Users', icon: User },
    { id: 'qr-scan', label: 'QR Scanner', icon: QrCode },
  ];

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-black/20 border-green-500/20' 
        : 'bg-white/20 border-green-600/20'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle - with higher z-index to stay above sidebar */}
            {showSidebarToggle && (
              <button
                onClick={onToggleSidebar}
                className={`relative z-[60] p-2 rounded-lg transition-colors duration-300 ${
                  isDark 
                    ? 'text-green-400 hover:bg-green-500/10' 
                    : 'text-green-600 hover:bg-green-600/10'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onPageChange('landing')}
            >
              <div className="relative">
                <Shield className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <div className={`absolute inset-0 w-8 h-8 rounded-full blur-md animate-pulse ${
                  isDark ? 'bg-green-400/20' : 'bg-green-600/20'
                }`}></div>
              </div>
              <span className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                isDark 
                  ? 'from-green-400 to-emerald-300' 
                  : 'from-green-600 to-emerald-500'
              }`}>
                ERI
              </span>
            </motion.div>
          </div>

          {/* Center Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id as any)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium
                    ${isActive 
                      ? isDark
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-green-600/20 text-green-600 border border-green-600/30'
                      : isDark
                        ? 'text-gray-300 hover:text-green-400 hover:bg-green-500/10' 
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell - only show when connected */}
            {isConnected && <NotificationBell />}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDark 
                  ? 'text-gray-300 hover:text-green-400 hover:bg-green-500/10' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wallet connection */}
            <Button
              onClick={handleWalletClick}
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              className="hidden md:block"
            >
              {isConnected 
                ? `${address!.slice(0, 6)}...${address!.slice(-4)}` 
                : 'Connect Wallet'
              }
            </Button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-green-400' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t py-4 ${
              isDark ? 'border-green-500/20' : 'border-green-600/20'
            }`}
          >
            <div className="space-y-2 mb-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium
                      ${isActive 
                        ? isDark
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-green-600/20 text-green-600 border border-green-600/30'
                        : isDark
                          ? 'text-gray-300 hover:text-green-400 hover:bg-green-500/10' 
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            
            <Button
              onClick={handleWalletClick}
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              className="w-full"
            >
              {isConnected 
                ? `${address!.slice(0, 6)}...${address!.slice(-4)}` 
                : 'Connect Wallet'
              }
            </Button>
          </motion.div>
        )}
      </div>
    </nav>
  );
};