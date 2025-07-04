import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { ManufacturerPage } from './pages/ManufacturerPage';
import { UserPage } from './pages/UserPage';
import { QRScanPage } from './pages/QRScanPage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './contexts/NotificationContext';

function AppContent() {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState<'landing' | 'manufacturer' | 'user' | 'qr-scan'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed to true by default
  const [activeFeature, setActiveFeature] = useState<string>('');

  // Handle URL parameters for QR code scanning
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const data = urlParams.get('data');
    
    if (page === 'qr-scan' && data) {
      setCurrentPage('qr-scan');
    }
  }, []);

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToFeature = (event: CustomEvent) => {
      const { page, feature } = event.detail;
      setCurrentPage(page);
      setActiveFeature(feature);
      setSidebarOpen(true);
    };

    window.addEventListener('navigate-to-feature', handleNavigateToFeature as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-feature', handleNavigateToFeature as EventListener);
    };
  }, []);

  // Auto-open sidebar when navigating to non-landing pages
  useEffect(() => {
    if (currentPage !== 'landing') {
      setSidebarOpen(true);
    }
  }, [currentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'manufacturer':
        return <ManufacturerPage activeFeature={activeFeature} />;
      case 'user':
        return <UserPage activeFeature={activeFeature} />;
      case 'qr-scan':
        return <QRScanPage />;
      default:
        return <LandingPage onPageChange={setCurrentPage} />;
    }
  };

  const showSidebar = currentPage !== 'landing';

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-black via-gray-900 to-green-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-green-50'
    }`}>
      {/* Matrix-style background animation */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-3'}`}>
        <div className={`absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent to-transparent animate-matrix ${
          isDark ? 'via-green-400' : 'via-green-600'
        }`}></div>
        <div className={`absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent to-transparent animate-matrix delay-1000 ${
          isDark ? 'via-green-400' : 'via-green-600'
        }`}></div>
        <div className={`absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent to-transparent animate-matrix delay-2000 ${
          isDark ? 'via-green-400' : 'via-green-600'
        }`}></div>
      </div>
      
      {/* Floating orbs */}
      <div className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float ${
        isDark ? 'bg-green-500/10' : 'bg-green-600/10'
      }`}></div>
      <div className={`absolute bottom-20 right-10 w-48 h-48 rounded-full blur-2xl animate-float delay-1000 ${
        isDark ? 'bg-green-400/5' : 'bg-green-600/5'
      }`}></div>
      
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle={showSidebar}
      />
      
      <div className="flex">
        {showSidebar && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            activeFeature={activeFeature}
            onFeatureChange={setActiveFeature}
          />
        )}
        
        <main className={`flex-1 transition-all duration-300 ${showSidebar && sidebarOpen ? 'ml-64' : ''}`}>
          {renderCurrentPage()}
        </main>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? "dark" : "light"}
        toastClassName={`backdrop-blur-xl border ${
          isDark 
            ? 'bg-gray-800/90 border-green-500/30' 
            : 'bg-white/90 border-green-600/30'
        }`}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;